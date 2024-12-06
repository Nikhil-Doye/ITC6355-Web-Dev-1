document
  .getElementById("feedbackForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      if (data.success) {
        document.getElementById("feedbackResponse").innerText = data.message;
        document.getElementById("feedbackForm").reset();
      } else {
        document.getElementById("feedbackResponse").innerText =
          "Failed to submit feedback.";
      }
    } catch (error) {
      console.error(error);
      document.getElementById("feedbackResponse").innerText = "Server error!";
    }
  });
