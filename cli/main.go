package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"raincheck/internal/api"
	"raincheck/internal/config"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "raincheck",
	Short: "Raincheck is a code review tool",
	Long:  `A command line tool for managing and automating code reviews.`,
}

var loginCmd = &cobra.Command{
	Use:   "login [apikey]",
	Short: "Store API key for authentication",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		apiKey := args[0]
		if err := config.SaveAPIKey(apiKey); err != nil {
			return fmt.Errorf("failed to save API key: %w", err)
		}
		log.Printf("API key stored successfully")
		return nil
	},
}

var reviewCmd = &cobra.Command{
	Use:   "review",
	Short: "Review code files",
}

func printCategory(name string, category api.Category) {
	fmt.Printf("\n%s (Score: %.1f/10)\n", strings.ToUpper(name), category.Score)
	fmt.Println(strings.Repeat("-", len(name)+15))

	if len(category.Issues) == 0 {
		fmt.Println("✓ No issues found")
		return
	}

	for _, issue := range category.Issues {
		severityColor := "🔵" // INFO
		if issue.Severity == "WARNING" {
			severityColor = "🟡"
		} else if issue.Severity == "ERROR" {
			severityColor = "🔴"
		}

		fmt.Printf("%s [%s] %s\n", severityColor, issue.Type, issue.Description)
		if issue.Line > 0 {
			fmt.Printf("   Line: %d\n", issue.Line)
		}
		if issue.Suggestion != "" {
			fmt.Printf("   💡 Suggestion: %s\n", issue.Suggestion)
		}
		fmt.Println()
	}
}

var reviewFileCmd = &cobra.Command{
	Use:   "file [filename]",
	Short: "Review a specific file",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		filename := args[0]

		// Read file content
		content, err := os.ReadFile(filename)
		if err != nil {
			return fmt.Errorf("failed to read file: %w", err)
		}

		// Get API key
		apiKey, err := config.GetAPIKey()
		if err != nil {
			return fmt.Errorf("authentication required: %w", err)
		}

		// Create API client
		client := api.NewClient(apiKey)

		// Analyze code
		resp, err := client.AnalyzeCode(string(content))
		if err != nil {
			return fmt.Errorf("failed to analyze code: %w", err)
		}

		// Print analysis results
		fmt.Printf("\n📊 Code Analysis Report for %s\n", filename)
		fmt.Println(strings.Repeat("=", 50))

		// Overall Score
		fmt.Printf("\n🏆 Overall Score: %.1f/10\n", resp.OverallScore)
		fmt.Println(strings.Repeat("-", 30))

		// Print each category
		printCategory("Security", resp.Security)
		printCategory("Performance", resp.Performance)
		printCategory("Code Quality", resp.CodeQuality)
		printCategory("Maintainability", resp.Maintainability)
		printCategory("Best Practices", resp.BestPractices)

		// Print suggestions
		if len(resp.Suggestions) > 0 {
			fmt.Printf("\n💡 General Suggestions\n")
			fmt.Println(strings.Repeat("-", 20))
			for _, suggestion := range resp.Suggestions {
				fmt.Printf("• %s\n", suggestion)
			}
		}

		fmt.Println("\n" + strings.Repeat("=", 50))
		return nil
	},
}

func isCodeFile(path string) bool {
	ext := strings.ToLower(filepath.Ext(path))
	codeExtensions := map[string]bool{
		".go":    true,
		".js":    true,
		".jsx":   true,
		".ts":    true,
		".tsx":   true,
		".py":    true,
		".java":  true,
		".cpp":   true,
		".c":     true,
		".h":     true,
		".hpp":   true,
		".rb":    true,
		".php":   true,
		".swift": true,
		".kt":    true,
		".rs":    true,
	}
	return codeExtensions[ext]
}

func shouldSkipDir(path string) bool {
	skipDirs := map[string]bool{
		".git":         true,
		"node_modules": true,
		"vendor":       true,
		"build":        true,
		"dist":         true,
		"target":       true,
		"__pycache__":  true,
	}
	return skipDirs[filepath.Base(path)]
}

func writeMarkdownReport(reports []struct {
	path     string
	response *api.AnalysisResponse
}, stats struct {
	totalFiles      int
	filesWithIssues int
	totalIssues     int
	overallScore    float64
}) error {
	file, err := os.Create("SCAN.md")
	if err != nil {
		return fmt.Errorf("failed to create SCAN.md: %w", err)
	}
	defer file.Close()

	// Write header
	fmt.Fprintf(file, "# Code Review Report\n\n")
	fmt.Fprintf(file, "Generated on: %s\n\n", time.Now().Format("2006-01-02 15:04:05"))

	// Write summary
	fmt.Fprintf(file, "## Summary\n\n")
	fmt.Fprintf(file, "- Total Files Scanned: %d\n", stats.totalFiles)
	fmt.Fprintf(file, "- Files with Issues: %d\n", stats.filesWithIssues)
	fmt.Fprintf(file, "- Total Issues Found: %d\n", stats.totalIssues)
	if stats.totalFiles > 0 {
		fmt.Fprintf(file, "- Average Score: %.1f/10\n\n", stats.overallScore/float64(stats.totalFiles))
	}

	// Write detailed reports
	fmt.Fprintf(file, "## Detailed Reports\n\n")
	for _, report := range reports {
		fmt.Fprintf(file, "### %s\n\n", report.path)
		fmt.Fprintf(file, "**Overall Score:** %.1f/10\n\n", report.response.OverallScore)

		// Write each category
		categories := map[string]api.Category{
			"Security":        report.response.Security,
			"Performance":     report.response.Performance,
			"Code Quality":    report.response.CodeQuality,
			"Maintainability": report.response.Maintainability,
			"Best Practices":  report.response.BestPractices,
		}

		for name, category := range categories {
			fmt.Fprintf(file, "#### %s (Score: %.1f/10)\n\n", name, category.Score)

			if len(category.Issues) == 0 {
				fmt.Fprintf(file, "✓ No issues found\n\n")
				continue
			}

			for _, issue := range category.Issues {
				severity := "🔵 INFO"
				if issue.Severity == "WARNING" {
					severity = "🟡 WARNING"
				} else if issue.Severity == "ERROR" {
					severity = "🔴 ERROR"
				}

				fmt.Fprintf(file, "- %s [%s] %s\n", severity, issue.Type, issue.Description)
				if issue.Line > 0 {
					fmt.Fprintf(file, "  - Line: %d\n", issue.Line)
				}
				if issue.Suggestion != "" {
					fmt.Fprintf(file, "  - Suggestion: %s\n", issue.Suggestion)
				}
				fmt.Fprintf(file, "\n")
			}
		}

		// Write suggestions
		if len(report.response.Suggestions) > 0 {
			fmt.Fprintf(file, "#### General Suggestions\n\n")
			for _, suggestion := range report.response.Suggestions {
				fmt.Fprintf(file, "- %s\n", suggestion)
			}
			fmt.Fprintf(file, "\n")
		}

		fmt.Fprintf(file, "---\n\n")
	}

	return nil
}

var reviewAllCmd = &cobra.Command{
	Use:   "all",
	Short: "Review all files",
	RunE: func(cmd *cobra.Command, args []string) error {
		// Get API key
		apiKey, err := config.GetAPIKey()
		if err != nil {
			return fmt.Errorf("authentication required: %w", err)
		}

		// Create API client
		client := api.NewClient(apiKey)

		// Get current directory
		dir, err := os.Getwd()
		if err != nil {
			return fmt.Errorf("failed to get current directory: %w", err)
		}

		// Track statistics
		var (
			totalFiles      int
			filesWithIssues int
			totalIssues     int
			overallScore    float64
		)

		// Store reports for markdown file
		var reports []struct {
			path     string
			response *api.AnalysisResponse
		}

		fmt.Printf("\n🔍 Starting code review for all files in %s\n", dir)
		fmt.Println(strings.Repeat("=", 80))

		// Walk through all files
		err = filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			// Skip directories
			if info.IsDir() {
				if shouldSkipDir(path) {
					return filepath.SkipDir
				}
				return nil
			}

			// Check if it's a code file
			if !isCodeFile(path) {
				return nil
			}

			// Get relative path
			relPath, err := filepath.Rel(dir, path)
			if err != nil {
				return err
			}

			// Read file content
			content, err := os.ReadFile(path)
			if err != nil {
				fmt.Printf("⚠️  Failed to read %s: %v\n", relPath, err)
				return nil
			}

			// Analyze code
			resp, err := client.AnalyzeCode(string(content))
			if err != nil {
				fmt.Printf("⚠️  Failed to analyze %s: %v\n", relPath, err)
				return nil
			}

			// Update statistics
			totalFiles++
			overallScore += resp.OverallScore

			// Count issues
			fileIssues := 0
			fileIssues += len(resp.Security.Issues)
			fileIssues += len(resp.Performance.Issues)
			fileIssues += len(resp.CodeQuality.Issues)
			fileIssues += len(resp.Maintainability.Issues)
			fileIssues += len(resp.BestPractices.Issues)

			if fileIssues > 0 {
				filesWithIssues++
				totalIssues += fileIssues
			}

			// Store report
			reports = append(reports, struct {
				path     string
				response *api.AnalysisResponse
			}{
				path:     relPath,
				response: resp,
			})

			// Print report for this file
			fmt.Printf("\n📊 Code Analysis Report for %s\n", relPath)
			fmt.Println(strings.Repeat("=", 80))

			// Overall Score
			fmt.Printf("\n🏆 Overall Score: %.1f/10\n", resp.OverallScore)
			fmt.Println(strings.Repeat("-", 30))

			// Print each category
			printCategory("Security", resp.Security)
			printCategory("Performance", resp.Performance)
			printCategory("Code Quality", resp.CodeQuality)
			printCategory("Maintainability", resp.Maintainability)
			printCategory("Best Practices", resp.BestPractices)

			// Print suggestions
			if len(resp.Suggestions) > 0 {
				fmt.Printf("\n💡 General Suggestions\n")
				fmt.Println(strings.Repeat("-", 20))
				for _, suggestion := range resp.Suggestions {
					fmt.Printf("• %s\n", suggestion)
				}
			}

			fmt.Println(strings.Repeat("=", 80))
			return nil
		})

		if err != nil {
			return fmt.Errorf("error walking through files: %w", err)
		}

		// Print summary
		fmt.Printf("\n📈 Review Summary\n")
		fmt.Println(strings.Repeat("=", 80))
		fmt.Printf("Total Files Scanned: %d\n", totalFiles)
		fmt.Printf("Files with Issues: %d\n", filesWithIssues)
		fmt.Printf("Total Issues Found: %d\n", totalIssues)
		if totalFiles > 0 {
			fmt.Printf("Average Score: %.1f/10\n", overallScore/float64(totalFiles))
		}
		fmt.Println(strings.Repeat("=", 80))

		// Write markdown report
		stats := struct {
			totalFiles      int
			filesWithIssues int
			totalIssues     int
			overallScore    float64
		}{
			totalFiles:      totalFiles,
			filesWithIssues: filesWithIssues,
			totalIssues:     totalIssues,
			overallScore:    overallScore,
		}

		if err := writeMarkdownReport(reports, stats); err != nil {
			return fmt.Errorf("failed to write markdown report: %w", err)
		}

		fmt.Printf("\n📝 Report has been saved to SCAN.md\n")
		return nil
	},
}

var dashboardCmd = &cobra.Command{
	Use:   "dashboard",
	Short: "Open the dashboard",
	RunE: func(cmd *cobra.Command, args []string) error {
		open, _ := cmd.Flags().GetBool("open")
		if open {
			// TODO: Implement dashboard opening logic
			log.Printf("Opening dashboard")
		}
		return nil
	},
}

var applyCmd = &cobra.Command{
	Use:   "apply [changes]",
	Short: "Apply changes",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		changes := args[0]
		// TODO: Implement apply changes logic
		log.Printf("Applying changes: %s", changes)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(loginCmd)
	rootCmd.AddCommand(reviewCmd)
	reviewCmd.AddCommand(reviewFileCmd)
	reviewCmd.AddCommand(reviewAllCmd)
	rootCmd.AddCommand(dashboardCmd)
	rootCmd.AddCommand(applyCmd)

	dashboardCmd.Flags().BoolP("open", "o", false, "Open dashboard in browser")
}

func main() {
	if err := exec(); err != nil {
		log.Printf("Error executing application: %v", err)
		os.Exit(1)
	}
}

func exec() error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-interrupt
		cancel()
	}()

	return run(ctx)
}

func run(ctx context.Context) error {
	return rootCmd.ExecuteContext(ctx)
}
