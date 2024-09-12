const express = require('express');
const uuid = require('uuid');
const path = require('path');

const app = express();
const PORT = 5000;

// In-memory store to track valid links
let validLinks = {};

// Route to generate multiple download links dynamically
app.get('/generate-links', (req, res) => {
  const { files } = req.query; // User can provide file names via query, e.g., ?files=file1.pdf,file2.pdf

  if (!files) {
    return res.status(400).json({
      status: "error",
      message: "No files provided",
      data: "None",
    });
  }

  const fileArray = files.split(','); // Split file names by comma
  const downloadLinks = [];

  // Loop through each file and generate a unique download link
  fileArray.forEach(file => {
    const linkId = uuid.v4(); // Generate unique link ID
    const filePath = path.join(__dirname, file.trim());

    // Add link info to validLinks object
    validLinks[linkId] = {
      filePath,
      valid: true,
    };

    // Create dynamic download link
    const downloadLink = `${req.protocol}://${req.get('host')}/download/${linkId}`;
    downloadLinks.push(downloadLink);
  });

  // Return generated download links
  return res.status(200).json({
    status: "success",
    message: "Links generated successfully",
    data: downloadLinks,
  });
});

// Route to handle downloading the file
app.get('/download/:linkId', (req, res) => {
  const { linkId } = req.params;

  // Check if the link is valid and unused
  if (validLinks[linkId] && validLinks[linkId].valid) {
    const filePath = validLinks[linkId].filePath;

    // Mark the link as used (it becomes invalid after this request)
    validLinks[linkId].valid = false;

    // Send the file for download
    res.download(filePath, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error downloading file.');
      }
    });
  } else {
    // If the link is invalid or already used
    return res.status(400).json({
      status: "error",
      message: "Invalid or expired link",
      data: "None",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
