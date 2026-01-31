import axios from "axios";

export async function evaluateSubmissionWithAI(
  challengeTitle: string,
  submission: string,
  maxPoints: number
): Promise<number> {
  console.log(' Starting AI evaluation...');
  console.log(' Challenge Title:', challengeTitle);
  console.log(' Submission length:', submission.length);
  console.log(' Max Points:', maxPoints);
  console.log(' First 200 chars of submission:', submission.substring(0, 200));

  try {
    // Use Ollama for local testing
    if (process.env.NODE_ENV !== "production") {
      console.log('🔬 Using Ollama for local testing');
      const response = await axios.post("http://localhost:11434/api/generate", {
        model: "phi:latest",
        prompt: `Evaluate this submission for the challenge "${challengeTitle}". 
        Submission: ${submission}
        Max Points: ${maxPoints}
        Return only a number between 0 and ${maxPoints} representing the score.`,
        stream: false,
      });
      
      console.log(' Received response from Ollama');
      console.log(' Raw AI response:', response.data.response);
      
      const scoreMatch = response.data.response.match(/\d+/);
      const score = parseInt(scoreMatch?.[0] || "0");
      const finalScore = Math.min(Math.max(score, 0), maxPoints);
      
      console.log(' Extracted score:', score);
      console.log(' Final normalized score:', finalScore);
      
      return finalScore;
    }

    // Use Gemini for production
    console.log(' Using Gemini for production');
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Evaluate this submission for the challenge "${challengeTitle}". 
            Submission: ${submission}
            Max Points: ${maxPoints}
            Return only a number between 0 and ${maxPoints} representing the score.`
          }]
        }]
      }
    );
    
    console.log(' Received response from Gemini');
    const scoreText = response.data.candidates[0].content.parts[0].text;
    console.log(' Raw AI response:', scoreText);
    
    const scoreMatch = scoreText.match(/\d+/);
    const score = parseInt(scoreMatch?.[0] || "0");
    const finalScore = Math.min(Math.max(score, 0), maxPoints);
    
    console.log(' Extracted score:', score);
    console.log(' Final normalized score:', finalScore);
    
    return finalScore;
  } catch (error) {
    console.error("❌ AI evaluation error:", error);
    console.log(' Returning default score of 0 due to error');
    return 0;
  }
}