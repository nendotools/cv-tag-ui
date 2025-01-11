self.onmessage = async function(event) {
  const apiUrl = event.data; // Expecting the API URL to be sent from the main thread

  try {
    const response = await fetch('/api/files', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: apiUrl })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // chunk the data and send it back to the main thread
    while (data.files.length) {
      self.postMessage({ success: true, data: data.files.splice(0, 50) });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error: any) {
    self.postMessage({ success: false, error: error.message });
  }
};
