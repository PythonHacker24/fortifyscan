import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

interface ReviewProps {
  onReviewSubmit: (feedback: { liked: boolean; comment: string }) => void;
}

const Review: React.FC<ReviewProps> = ({ onReviewSubmit }) => {
  const [showReview, setShowReview] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReview(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (liked === null) return;

    setIsSubmitting(true);
    try {
      await onReviewSubmit({ liked, comment });
      setShowReview(false);
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showReview) return null;

  return (
    <div className="fixed bottom-8 right-8 bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-lg max-w-md w-full">
      <h3 className="text-lg font-semibold text-blue-400 mb-4">How was your experience?</h3>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setLiked(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            liked === true
              ? 'bg-green-900 text-green-400 border border-green-700'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <ThumbsUp className="w-5 h-5" />
          <span>Helpful</span>
        </button>
        
        <button
          onClick={() => setLiked(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            liked === false
              ? 'bg-red-900 text-red-400 border border-red-700'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <ThumbsDown className="w-5 h-5" />
          <span>Not Helpful</span>
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-gray-400 mb-2">Additional Feedback (Optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowReview(false)}
          className="px-4 py-2 text-gray-400 hover:text-gray-300"
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={liked === null || isSubmitting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            liked === null || isSubmitting
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
        </button>
      </div>
    </div>
  );
};

export default Review; 