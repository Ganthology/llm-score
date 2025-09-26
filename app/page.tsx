export default function Home() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-mono">
      <div className="max-w-lg w-full bg-white border border-gray-200 p-8 text-center">
        <h1 className="text-2xl font-bold text-black mb-4">LLMScore</h1>
        <p className="text-base text-gray-800 mb-8 leading-relaxed">
          Is your website LLM friendly? Get your LLM score now
        </p>

        <form className="space-y-6">
          <div>
            <input
              type="url"
              placeholder="https://example.com"
              className="w-full px-4 py-3 border border-gray-300 bg-white text-black placeholder-gray-500 focus:border-black focus:outline-none transition-colors font-mono text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white py-3 px-6 border border-black hover:border-gray-800 transition-colors duration-200 font-mono text-sm"
          >
            Get My LLM Score
          </button>
        </form>
      </div>
    </div>
  );
}