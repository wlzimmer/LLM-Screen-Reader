API_KEY = "sk**************"
console.log ('...', API_KEY)
const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Hello from browser" }]
  })
});

const data = await response.json();
console.log('...', data.choices[0].message);
console.log('...', response.output_text);  


---------------------------------------------------------------------
async analyzePageContent(content, task) {
    const messages = [
      {
        role: 'system',
        content: `You are a web automation assistant. Analyze the provided HTML content and determine how to accomplish the given task. Provide specific instructions for interacting with the page elements.`
      },
      {
        role: 'user',
        content: `Page content: ${content.substring(0, 4000)}\n\nTask: ${task}\n\nProvide specific CSS selectors and actions needed.`
      }
    ];

    return await this.callGPT(messages);
  }
}

