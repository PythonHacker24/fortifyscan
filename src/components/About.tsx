import Image from 'next/image';

export default function About() {
  return (
    <section className="container mx-auto px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-blue-400 mb-4">Behind Raincheck</h2>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Circular Photo */}
          <div className="relative w-48 h-48 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 rounded-full blur-lg opacity-50 animate-pulse" />
            <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-gray-800">
              <Image
                src="/aditya.png"
                alt="Aditya Patil"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-semibold text-blue-400 mb-2">Aditya Patil</h3>
            <p className="text-gray-400 mb-4">
              GSoC Contributor for Emory University School of Medicine
            </p>
            <p className="text-gray-300">
              I'm passionate about building developer tools that make coding more efficient and enjoyable. 
              With a focus on code quality and developer experience, I am building Raincheck to help developers 
              streamline their code review process and maintain high standards in their codebase.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
} 