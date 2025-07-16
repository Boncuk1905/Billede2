const fileInput = document.getElementById("fileInput");
const productPreview = document.getElementById("product-preview");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const downloadBtn = document.getElementById("downloadBtn");

let images = [];

fileInput.addEventListener("change", async () => {
  productPreview.innerHTML = "";
  images = [];

  const files = Array.from(fileInput.files);

  for (const file of files) {
    const img = await loadImageFromFile(file);
    const mask = await removeBackground(img);
    const resultImg = applyMask(img, mask);
    images.push(resultImg);
    const card = document.createElement("div");
    card.className = "product-card";
    const imgEl = new Image();
    imgEl.src = resultImg.toDataURL();
    card.appendChild(imgEl);
    productPreview.appendChild(card);
  }

  drawOnCanvas(images);
});

async function loadImageFromFile(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(file);
  });
}

async function removeBackground(img) {
  const net = await bodyPix.load();
  const segmentation = await net.segmentPerson(img, {
    internalResolution: 'medium',
    segmentationThreshold: 0.7,
  });
  return segmentation;
}

function applyMask(img, segmentation) {
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = img.width;
  tmpCanvas.height = img.height;
  const tmpCtx = tmpCanvas.getContext("2d");
  tmpCtx.drawImage(img, 0, 0);
  const imageData = tmpCtx.getImageData(0, 0, img.width, img.height);

  for (let i = 0; i < segmentation.data.length; i++) {
    if (segmentation.data[i] === 0) {
      imageData.data[i * 4 + 3] = 0;
    }
  }

  tmpCtx.putImageData(imageData, 0, 0);
  return tmpCanvas;
}

function drawOnCanvas(images) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const spacing = 40;
  const itemWidth = (canvas.width - spacing * (images.length + 1)) / images.length;
  const itemHeight = canvas.height - 80;

  images.forEach((img, i) => {
    const x = spacing + i * (itemWidth + spacing);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 20;
    ctx.drawImage(img, x, 40, itemWidth, itemHeight);
    ctx.restore();
  });
}

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  canvas.toBlob(blob => {
    link.href = URL.createObjectURL(blob);
    link.download = "samlet-produktbillede.png";
    link.click();
  });
});
