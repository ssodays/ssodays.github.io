function showSection(id, button){

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    document.getElementById(id).classList.add('active');

    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('active');
    });

    button.classList.add('active');

    window.scrollTo(0,0);
}


async function loadPDFs(){

    const pdfList = document.getElementById("pdfList");

    try{

        const response = await fetch(
            "https://api.github.com/repos/ssodays/ssodays.github.io/contents/Pdf"
        );

        const files = await response.json();

        const pdfs = files.filter(file =>
            file.type === "file" &&
            file.name.toLowerCase().endsWith(".pdf")
        );

        if(pdfs.length === 0){
            pdfList.innerHTML = "<p>अभी कोई PDF उपलब्ध नहीं है।</p>";
            return;
        }

        pdfList.innerHTML = "";

        pdfs.forEach(file => {

            const pdfURL =
                "Pdf/" + encodeURIComponent(file.name);

            const item = document.createElement("div");
            item.className = "pdf-item";

            item.innerHTML = `
                <div class="pdf-title">📄 ${file.name}</div>

                <button class="btn"
                    onclick="openPDF('${pdfURL}')">
                    View PDF
                </button>

                <a class="btn"
                    href="${pdfURL}"
                    download>
                    Download
                </a>
            `;

            pdfList.appendChild(item);
        });

    }catch(error){

        pdfList.innerHTML =
            "<p>PDFs load नहीं हो पाईं।</p>";
    }
}


function openPDF(url){

    const viewer = document.getElementById("pdfViewer");
    const frame = document.getElementById("pdfFrame");

    const fullURL = new URL(url, window.location.href).href;

    frame.src =
        "https://mozilla.github.io/pdf.js/web/viewer.html?file=" +
        encodeURIComponent(fullURL);

    viewer.style.display = "flex";
}


function closePDF(){

    const viewer = document.getElementById("pdfViewer");
    const frame = document.getElementById("pdfFrame");

    frame.src = "";
    viewer.style.display = "none";
}


loadPDFs();
/* ================= IMAGE TOOLS ================= */

(function(){

const toolsSection = document.getElementById("tools");

if(!toolsSection) return;

const card = toolsSection.querySelector(".card");

card.insertAdjacentHTML("beforeend", `
<div class="tool-box">

    <input type="file" id="imageInput"
        class="tool-input"
        accept="image/*">

    <div id="imageArea" class="image-preview"></div>

    <div class="tool-row">
        <button class="btn" id="cropBtn">✂️ Crop</button>
        <button class="btn" id="applyCropBtn" style="display:none">
            ✅ Apply Crop
        </button>
    </div>

    <div class="tool-row">
        <input type="number"
            id="imageWidth"
            placeholder="Width (px)"
            min="1">

        <input type="number"
            id="imageHeight"
            placeholder="Height (px)"
            min="1">
    </div>

    <div class="tool-row">
        <select id="imageFormat">
            <option value="image/jpeg">JPG</option>
            <option value="image/webp">WEBP</option>
            <option value="image/png">PNG</option>
        </select>

        <input type="number"
            id="targetKB"
            placeholder="Target KB"
            min="1">
    </div>

    <div class="tool-row">
        <button class="btn" id="processImageBtn">
            🔄 Resize / Convert
        </button>
    </div>

    <div id="toolStatus" style="margin-top:12px;"></div>

    <div id="toolResult" class="tool-result"></div>

</div>
`);


const input = document.getElementById("imageInput");
const imageArea = document.getElementById("imageArea");
const cropBtn = document.getElementById("cropBtn");
const applyCropBtn = document.getElementById("applyCropBtn");
const widthInput = document.getElementById("imageWidth");
const heightInput = document.getElementById("imageHeight");
const formatInput = document.getElementById("imageFormat");
const targetKBInput = document.getElementById("targetKB");
const processBtn = document.getElementById("processImageBtn");
const status = document.getElementById("toolStatus");
const result = document.getElementById("toolResult");

let canvas = null;
let cropBox = null;
let cropArea = null;
let cropMode = false;
let startX = 0;
let startY = 0;
let selecting = false;
let currentObjectURL = null;


/* PHOTO SELECT */

input.addEventListener("change", function(){

    const file = this.files[0];

    if(!file) return;

    if(!file.type.startsWith("image/")){
        status.innerText = "कृपया image file चुनें।";
        return;
    }

    const img = new Image();

    img.onload = function(){

        imageArea.innerHTML = `
            <div class="crop-area" id="cropArea">
                <canvas id="imageCanvas"></canvas>
                <div class="crop-box" id="cropBox"></div>
            </div>
        `;

        cropArea = document.getElementById("cropArea");
        canvas = document.getElementById("imageCanvas");
        cropBox = document.getElementById("cropBox");

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img,0,0);

        widthInput.value = img.naturalWidth;
        heightInput.value = img.naturalHeight;

        status.innerText =
            "Original: " +
            img.naturalWidth + " × " +
            img.naturalHeight + " px | " +
            Math.round(file.size/1024) + " KB";

        result.innerHTML = "";

        cropMode = false;
        cropBox.style.display = "none";
        applyCropBtn.style.display = "none";
    };

    img.src = URL.createObjectURL(file);
});


/* CROP BUTTON */

cropBtn.addEventListener("click", function(){

    if(!canvas){
        status.innerText = "पहले photo चुनें।";
        return;
    }

    cropMode = true;
    cropBox.style.display = "block";
    cropBox.style.left = "0px";
    cropBox.style.top = "0px";
    cropBox.style.width = "0px";
    cropBox.style.height = "0px";

    applyCropBtn.style.display = "inline-block";

    status.innerText =
        "Photo पर उंगली से drag करके crop area चुनें।";
});


/* CROP SELECTION */

imageArea.addEventListener("pointerdown", function(e){
    if(!cropMode) return;

    const rect = canvas.getBoundingClientRect();

    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    selecting = true;

    cropBox.style.left = startX + "px";
    cropBox.style.top = startY + "px";
    cropBox.style.width = "0px";
    cropBox.style.height = "0px";

    cropArea.setPointerCapture(e.pointerId);
});


imageArea.addEventListener("pointermove", function(e){

    if(!selecting || !cropMode) return;

    const rect = canvas.getBoundingClientRect();

    let currentX = e.clientX - rect.left;
    let currentY = e.clientY - rect.top;

    currentX = Math.max(0, Math.min(currentX, rect.width));
    currentY = Math.max(0, Math.min(currentY, rect.height));

    const left = Math.min(startX,currentX);
    const top = Math.min(startY,currentY);

    const width = Math.abs(currentX-startX);
    const height = Math.abs(currentY-startY);

    cropBox.style.left = left + "px";
    cropBox.style.top = top + "px";
    cropBox.style.width = width + "px";
    cropBox.style.height = height + "px";
});


imageArea.addEventListener("pointerup", function(){

    selecting = false;

});


/* APPLY CROP */

applyCropBtn.addEventListener("click", function(){

    if(!canvas) return;

    const box = cropBox.getBoundingClientRect();
    const rect = canvas.getBoundingClientRect();

    const displayX = box.left - rect.left;
    const displayY = box.top - rect.top;

    const displayW = box.width;
    const displayH = box.height;

    if(displayW < 10 || displayH < 10){
        status.innerText = "पहले crop area select करें।";
        return;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const sx = displayX * scaleX;
    const sy = displayY * scaleY;
    const sw = displayW * scaleX;
    const sh = displayH * scaleY;

    const newCanvas = document.createElement("canvas");

    newCanvas.width = Math.round(sw);
    newCanvas.height = Math.round(sh);

    const ctx = newCanvas.getContext("2d");

    ctx.drawImage(
        canvas,
        sx,sy,sw,sh,
        0,0,newCanvas.width,newCanvas.height
    );

    canvas = newCanvas;

    imageArea.innerHTML = `
        <div class="crop-area" id="cropArea">
            <canvas id="imageCanvas"></canvas>
            <div class="crop-box" id="cropBox"></div>
        </div>
    `;

    cropArea = document.getElementById("cropArea");
    const newCanvasElement = document.getElementById("imageCanvas");

    newCanvasElement.width = canvas.width;
    newCanvasElement.height = canvas.height;

    newCanvasElement
        .getContext("2d")
        .drawImage(canvas,0,0);

    canvas = newCanvasElement;
    cropBox = document.getElementById("cropBox");

    widthInput.value = canvas.width;
    heightInput.value = canvas.height;

    cropMode = false;
    cropBox.style.display = "none";
    applyCropBtn.style.display = "none";

    status.innerText =
        "Crop complete: " +
        canvas.width + " × " +
        canvas.height + " px";
});


/* RESIZE + KB CONVERT */

processBtn.addEventListener("click", async function(){

    if(!canvas){
        status.innerText = "पहले photo चुनें।";
        return;
    }

    let width = parseInt(widthInput.value);
    let height = parseInt(heightInput.value);

    if(!width || !height){
        width = canvas.width;
        height = canvas.height;
    }

    const format = formatInput.value;
    const targetKB = parseFloat(targetKBInput.value);

    if(format === "image/png" && targetKB){
        status.innerText =
            "PNG में exact KB compression संभव नहीं है। JPG या WEBP चुनें।";
        return;
    }

    let outCanvas = document.createElement("canvas");

    outCanvas.width = width;
    outCanvas.height = height;

    let ctx = outCanvas.getContext("2d");

    if(format === "image/jpeg"){
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0,0,width,height);
    }

    ctx.drawImage(canvas,0,0,width,height);

    let blob;

    if(targetKB && (format === "image/jpeg" || format === "image/webp")){

        let quality = 0.9;

        blob = await canvasToBlob(
            outCanvas,
            format,
            quality
        );

        for(let i=0;i<12 && blob.size > targetKB*1024;i++){

            quality -= 0.07;

            if(quality < 0.1)
                quality = 0.1;

            blob = await canvasToBlob(
                outCanvas,
                format,
                quality
            );
        }

        /*
         If still too large,
         reduce dimensions gradually.
        */

        let attempts = 0;

        while(blob.size > targetKB*1024 && attempts < 15){

            width = Math.max(50,Math.round(width*0.9));
            height = Math.max(50,Math.round(height*0.9));

            outCanvas.width = width;
            outCanvas.height = height;

            ctx = outCanvas.getContext("2d");

            if(format === "image/jpeg"){
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0,0,width,height);
            }

            ctx.drawImage(canvas,0,0,width,height);

            blob = await canvasToBlob(
                outCanvas,
                format,
                0.7
            );

            attempts++;
        }

    }else{

        blob = await canvasToBlob(
            outCanvas,
            format,
            0.9
        );
    }


    if(currentObjectURL){
        URL.revokeObjectURL(currentObjectURL);
    }

    currentObjectURL = URL.createObjectURL(blob);

    const extension =
        format === "image/png" ? "png" :
        format === "image/webp" ? "webp" : "jpg";

    result.innerHTML = `
        <div>
            <b>Result</b><br>
            ${width} × ${height} px<br>
            ${Math.round(blob.size/1024)} KB
        </div>

        <a class="btn"
           href="${currentObjectURL}"
           download="SSODAYS-image.${extension}">
           ⬇️ Download Image
        </a>
    `;

    status.innerText = "Image तैयार है ✅";

});


/* CANVAS TO BLOB */

function canvasToBlob(canvas,format,quality){

    return new Promise(function(resolve){

        canvas.toBlob(
            function(blob){
                resolve(blob);
            },
            format,
            quality
        );

    });

}

})();
