const form = document.getElementById('url-shortener-form');
const longUrlInput = document.getElementById('long-url');
const shortenedUrlInput = document.getElementById('shortened-url');
const copyBtn = document.getElementById('copy-btn');
const customDomainInput = document.getElementById('custom-domain');
const qrCodeContainer = document.getElementById('qr-code');
const similarityCheckBtn = document.getElementById('similarity-check-btn');
const similarityCheckResult = document.getElementById('similarity-check-result');

// Bitly API access token
const accessToken = 'Access Token';

// TensorFlow.js model for similarity checking
let model;

// Initialize the TensorFlow.js model for similarity checking
async function initializeModel() {
  console.log('Loading the Universal Sentence Encoder model...');
  model = await use.load();
  console.log('The Universal Sentence Encoder model has been loaded.');
}

// Shorten the URL
async function shortenUrl(longUrl, domain) {
  const url = `https://api-ssl.bitly.com/v4/shorten`;
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      long_url: longUrl,
      domain: domain
    })
  };
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data.link;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Copy the shortened URL to the clipboard
function copyToClipboard() {
  shortenedUrlInput.select();
  document.execCommand('copy');
}

// Generate a QR code for the shortened URL
function generateQrCode(shortenedUrl) {
  const qrCode = new QRCode(qrCodeContainer, {
    text: shortenedUrl,
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
}

// Handle form submission
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Get the long URL and custom domain
  const longUrl = longUrlInput.value.trim();
  const domain = customDomainInput.value.trim();

  // Shorten the URL
  const shortenedUrl = await shortenUrl(longUrl, domain);

  if (shortenedUrl) {
    // Display the shortened URL
    shortenedUrlInput.value = shortenedUrl;
    shortenedUrlInput.select();

    // Copy the shortened URL to the clipboard when the copy button is clicked
    copyBtn.addEventListener('click', copyToClipboard);

    // Generate a QR code for the shortened URL
    generateQrCode(shortenedUrl);

    // Check the similarity between the long URL and the shortened URL
    const isSimilarToLongUrl = isSimilar(shortenedUrl, longUrl);
    if (isSimilarToLongUrl) {
      similarityCheckResult.innerText = 'The shortened URL is similar to the long URL.';
      similarityCheckResult.classList.add('success');
      similarityCheckResult.classList.remove('error');
    } else {
      similarityCheckResult.innerText = 'The shortened URL is not similar to the long URL.';
      similarityCheckResult.classList.add('error');
      similarityCheckResult.classList.remove('success');
    }
  }
});

// Check the similarity between two strings using the TensorFlow.js model
function isSimilar(text1, text2) {
  const embeddings = model.embed([text1, text2]);
  const distance = embeddings.arraySync()[0].reduce((sum, value, index) => {
    return sum + Math.pow(Math.abs(value - embeddings.arraySync()[1][index]), 2);
}, 0);
const similarity = 1 / (1 + Math.sqrt(distance));
return similarity >= 0.75;
}

// Initialize the TensorFlow.js model for similarity checking when the page is loaded
window.addEventListener('load', initializeModel);
