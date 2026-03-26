// Interactive typing logic for the Terminal
const codeSnippet = document.getElementById("code-snippet");

if (codeSnippet) {
  const code = "npm install ai-sdk-agentic";
  let i = 0;
  
  // Clear the static text and leave only the prompt and cursor
  codeSnippet.innerHTML = '<span class="prompt">$</span> <span id="typed-text"></span><span class="cursor"></span>';
  const targetElement = document.getElementById("typed-text");

  setTimeout(() => {
    const typingEffect = setInterval(() => {
      if (targetElement && i < code.length) {
        targetElement.innerHTML += code.charAt(i);
        i++;
      } else {
        clearInterval(typingEffect);
      }
    }, 100); // Typing speed in ms
  }, 1000); // 1-second delay before typing starts
}
