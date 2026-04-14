import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function QuestionBank({ questions, onAdd, onRemove, onClear }) {
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const handleAdd = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error('Both question and answer required');
      return;
    }
    onAdd(newQuestion.trim(), newAnswer.trim());
    setNewQuestion('');
    setNewAnswer('');
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 mt-6">
      <h3 className="text-xl font-semibold text-white mb-4">📚 Question Bank</h3>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Question"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          className="flex-1 min-w-[200px] p-2 bg-gray-700 rounded text-white"
        />
        <input
          type="text"
          placeholder="Answer"
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
          className="flex-1 min-w-[150px] p-2 bg-gray-700 rounded text-white"
        />
        <button onClick={handleAdd} className="bg-green-600 px-4 rounded hover:bg-green-700">
          + Add
        </button>
      </div>
      {questions.length === 0 && (
        <p className="text-gray-400 text-sm text-center">No questions yet. Add some above.</p>
      )}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {questions.map((q, idx) => (
          <div key={idx} className="flex justify-between items-center bg-gray-700 p-2 rounded">
            <div className="flex-1">
              <p className="text-white text-sm">{q.question}</p>
              <p className="text-purple-300 text-xs">Answer: {q.answer}</p>
            </div>
            <button onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-300 px-2 text-xl">
              ✕
            </button>
          </div>
        ))}
      </div>
      {questions.length > 0 && (
        <button onClick={onClear} className="mt-4 text-red-400 text-sm hover:text-red-300">
          Clear all questions
        </button>
      )}
    </div>
  );
}