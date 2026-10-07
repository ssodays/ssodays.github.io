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


/* ================= PDF SYSTEM ================= */

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
            pdfList.innerHTML =
                "<p>अभी कोई PDF उपलब्ध नहीं है।</p>";
            return;
        }

        pdfList.innerHTML = "";

        pdfs.forEach(file => {

            const pdfURL =
                "Pdf/" + encodeURIComponent(file.name);

            const item = document.createElement("div");
            item.className = "pdf-item";

            item.innerHTML = `
                <div class="pdf-title">
                    📄 ${file.name}
                </div>

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

    const viewer =
        document.getElementById("pdfViewer");

    const frame =
        document.getElementById("pdfFrame");

    const fullURL =
        new URL(url, window.location.href).href;

    frame.src =
        "https://mozilla.github.io/pdf.js/web/viewer.html?file=" +
        encodeURIComponent(fullURL);

    viewer.style.display = "flex";
}


function closePDF(){

    const viewer =
        document.getElementById("pdfViewer");

    const frame =
        document.getElementById("pdfFrame");

    frame.src = "";

    viewer.style.display = "none";
}


loadPDFs();


/* ================================================= */
/* ================= IMAGE TOOLS ==================== */
/* ================================================= */

(function(){

    const toolsSection =
        document.getElementById("tools");

    if(!toolsSection) return;


    const card =
        toolsSection.querySelector(".card");


    /* TOOL HTML */

    card.insertAdjacentHTML("beforeend", `

        <div class="tool-box">

            <input
                type="file"
                id="imageInput"
                class="tool-input"
                accept="image/*"
            >


            <div
                id="imageEditor"
                style="display:none;"
            >

                <div class="image-editor-area">

                    <img
                        id="editImage"
                        alt="Selected Image"
                    >

                </div>


                <div class="rotate-controls">

                    <button
                        class="btn"
                        type="button"
                        id="rotateLeftBtn">
                        ↶ -1°
                    </button>


                    <input
                        type="range"
                        id="rotateSlider"
                        min="-180"
                        max="180"
                        value="0"
                        step="1"
                    >


                    <button
                        class="btn"
                        type="button"
                        id="rotateRightBtn">
                        ↷ +1°
                    </button>

                </div>


                <div class="rotate-value">

                    Rotation:
                    <span id="rotateValue">0</span>°

                </div>


                <div class="zoom-controls">

                    <button
                        class="btn"
                        type="button"
                        id="zoomOutBtn">
                        🔍 −
                    </button>


                    <button
                        class="btn"
                        type="button"
                        id="zoomInBtn">
                        🔍 +
                    </button>


                    <button
                        class="btn"
                        type="button"
                        id="resetEditorBtn">
                        🔄 Reset
                    </button>

                </div>


                <div class="tool-row">

                    <button
                        class="btn"
                        type="button"
                        id="applyCropBtn">
                        ✂️ Apply Crop
                    </button>

                </div>


                <div
                    class="tool-row"
                    id="resizeControls"
                    style="display:none;"
                >

                    <input
                        type="number"
                        id="imageWidth"
                        placeholder="Width (px)"
                        min="1"
                    >


                    <input
                        type="number"
                        id="imageHeight"
                        placeholder="Height (px)"
                        min="1"
                    >

                </div>


                <div
                    class="tool-row"
                    id="convertControls"
                    style="display:none;"
                >

                    <select id="imageFormat">

                        <option value="image/jpeg">
                            JPG
                        </option>

                        <option value="image/webp">
                            WEBP
                        </option>

                        <option value="image/png">
                            PNG
                        </option>

                    </select>


                    <input
                        type="number"
                        id="targetKB"
                        placeholder="Target KB"
                        min="1"
                    >

                </div>


                <div
                    class="tool-row"
                    id="processControls"
                    style="display:none;"
                >

                    <button
                        class="btn"
                        type="button"
                        id="processImageBtn">
                        🔄 Resize / Convert
                    </button>

                </div>


                <div
                    id="toolStatus"
                    style="margin-top:12px;">
                </div>


                <div
                    id="toolResult"
                    class="tool-result">
                </div>

            </div>

        </div>

    `);


    /* ================= ELEMENTS ================= */

    const input =
        document.getElementById("imageInput");

    const editor =
        document.getElementById("imageEditor");

    const image =
        document.getElementById("editImage");

    const rotateLeftBtn =
        document.getElementById("rotateLeftBtn");

    const rotateRightBtn =
        document.getElementById("rotateRightBtn");

    const rotateSlider =
        document.getElementById("rotateSlider");

    const rotateValue =
        document.getElementById("rotateValue");

    const zoomInBtn =
        document.getElementById("zoomInBtn");

    const zoomOutBtn =
        document.getElementById("zoomOutBtn");

    const resetEditorBtn =
        document.getElementById("resetEditorBtn");

    const applyCropBtn =
        document.getElementById("applyCropBtn");

    const resizeControls =
        document.getElementById("resizeControls");

    const convertControls =
        document.getElementById("convertControls");

    const processControls =
        document.getElementById("processControls");

    const widthInput =
        document.getElementById("imageWidth");

    const heightInput =
        document.getElementById("imageHeight");

    const formatInput =
        document.getElementById("imageFormat");

    const targetKBInput =
        document.getElementById("targetKB");

    const processBtn =
        document.getElementById("processImageBtn");

    const status =
        document.getElementById("toolStatus");

    const result =
        document.getElementById("toolResult");


    let cropper = null;

    let currentRotation = 0;

    let currentObjectURL = null;


    /* ================= PHOTO SELECT ================= */

    input.addEventListener("change", function(){

        const file =
            this.files[0];

        if(!file) return;


        if(!file.type.startsWith("image/")){

            status.innerText =
                "कृपया image file चुनें।";

            return;
        }


        if(cropper){

            cropper.destroy();

            cropper = null;
        }


        if(currentObjectURL){

            URL.revokeObjectURL(
                currentObjectURL
            );

        }


        currentObjectURL =
            URL.createObjectURL(file);


        image.src =
            currentObjectURL;


        editor.style.display =
            "block";


        resizeControls.style.display =
            "none";

        convertControls.style.display =
            "none";

        processControls.style.display =
            "none";


        result.innerHTML = "";


        currentRotation = 0;

        rotateSlider.value = 0;

        rotateValue.innerText = "0";


        image.onload = function(){

            cropper =
                new Cropper(image, {

                    viewMode: 1,

                    dragMode: "move",

                    autoCrop: true,

                    responsive: true,

                    restore: true,

                    guides: true,

                    center: true,

                    highlight: true,

                    cropBoxMovable: true,

                    cropBoxResizable: true,

                    toggleDragModeOnDblclick: false,

                    zoomOnWheel: true,

                    zoomOnTouch: true,

                    background: false,

                    aspectRatio: NaN,

                    ready: function(){

                        status.innerText =
                            "Photo तैयार है। Crop box को adjust करें, zoom/move करें या rotate करें।";

                    }

                });

        };

    });


    /* ================= ROTATE LEFT ================= */

    rotateLeftBtn.addEventListener(
        "click",
        function(){

            if(!cropper) return;

            if(currentRotation > -180){

                currentRotation--;

                cropper.rotateTo(
                    currentRotation
                );

                rotateSlider.value =
                    currentRotation;

                rotateValue.innerText =
                    currentRotation;
            }

        }
    );


    /* ================= ROTATE RIGHT ================= */

    rotateRightBtn.addEventListener(
        "click",
        function(){

            if(!cropper) return;

            if(currentRotation < 180){

                currentRotation++;

                cropper.rotateTo(
                    currentRotation
                );

                rotateSlider.value =
                    currentRotation;

                rotateValue.innerText =
                    currentRotation;
            }

        }
    );


    /* ================= ROTATION SLIDER ================= */

    rotateSlider.addEventListener(
        "input",
        function(){

            if(!cropper) return;

            currentRotation =
                parseInt(this.value);

            cropper.rotateTo(
                currentRotation
            );

            rotateValue.innerText =
                currentRotation;
        }
    );


    /* ================= ZOOM IN ================= */

    zoomInBtn.addEventListener(
        "click",
        function(){

            if(!cropper) return;

            cropper.zoom(0.1);

        }
    );


    /* ================= ZOOM OUT ================= */

    zoomOutBtn.addEventListener(
        "click",
        function(){

            if(!cropper) return;

            cropper.zoom(-0.1);

        }
    );


    /* ================= RESET ================= */

    resetEditorBtn.addEventListener(
        "click",
        function(){

            if(!cropper) return;

            cropper.reset();

            currentRotation = 0;

            rotateSlider.value = 0;

            rotateValue.innerText = "0";

            status.innerText =
                "Editor reset हो गया।";

        }
    );


    /* ================= APPLY CROP ================= */

    applyCropBtn.addEventListener(
        "click",
        function(){

            if(!cropper){

                status.innerText =
                    "पहले photo चुनें।";

                return;
            }


            const croppedCanvas =
                cropper.getCroppedCanvas({

                    imageSmoothingEnabled: true,

                    imageSmoothingQuality: "high"

                });


            if(!croppedCanvas){

                status.innerText =
                    "Crop नहीं हो पाया।";

                return;
            }


            widthInput.value =
                croppedCanvas.width;

            heightInput.value =
                croppedCanvas.height;


            resizeControls.style.display =
                "flex";

            convertControls.style.display =
                "flex";

            processControls.style.display =
                "flex";


            /* Store cropped canvas */

            window.finalImageCanvas =
                croppedCanvas;


            /* Destroy editor */

            cropper.destroy();

            cropper = null;


            /* Show cropped result */

            image.src =
                croppedCanvas.toDataURL(
                    "image/png"
                );


            status.innerText =
                "Crop complete ✅ अब Width, Height और Target KB चुनें।";

        }
    );


    /* ================= PROCESS IMAGE ================= */

    processBtn.addEventListener(
        "click",
        async function(){

            const sourceCanvas =
                window.finalImageCanvas;


            if(!sourceCanvas){

                status.innerText =
                    "पहले Crop Apply करें।";

                return;
            }


            let width =
                parseInt(
                    widthInput.value
                );

            let height =
                parseInt(
                    heightInput.value
                );


            if(!width || !height){

                width =
                    sourceCanvas.width;

                height =
                    sourceCanvas.height;
            }


            const format =
                formatInput.value;


            const targetKB =
                parseFloat(
                    targetKBInput.value
                );


            if(
                format === "image/png" &&
                targetKB
            ){

                status.innerText =
                    "PNG में Target KB compression नहीं किया जा सकता। JPG या WEBP चुनें।";

                return;
            }


            let outCanvas =
                document.createElement(
                    "canvas"
                );


            outCanvas.width =
                width;

            outCanvas.height =
                height;


            let ctx =
                outCanvas.getContext(
                    "2d"
                );


            if(format === "image/jpeg"){

                ctx.fillStyle =
                    "#ffffff";

                ctx.fillRect(
                    0,
                    0,
                    width,
                    height
                );
            }


            ctx.drawImage(
                sourceCanvas,
                0,
                0,
                width,
                height
            );


            let blob;


            /* ================= TARGET KB ================= */

            if(
                targetKB &&
                (
                    format === "image/jpeg" ||
                    format === "image/webp"
                )
            ){

                let quality =
                    0.90;


                blob =
                    await canvasToBlob(
                        outCanvas,
                        format,
                        quality
                    );


                /* Reduce quality */

                for(
                    let i = 0;
                    i < 15 &&
                    blob.size > targetKB * 1024;
                    i++
                ){

                    quality -= 0.05;

                    if(quality < 0.05){

                        quality = 0.05;
                    }


                    blob =
                        await canvasToBlob(
                            outCanvas,
                            format,
                            quality
                        );
                }


                /* Reduce dimensions if needed */

                let attempts = 0;


                while(
                    blob.size >
                    targetKB * 1024 &&
                    attempts < 20
                ){

                    width =
                        Math.max(
                            50,
                            Math.round(
                                width * 0.90
                            )
                        );


                    height =
                        Math.max(
                            50,
                            Math.round(
                                height * 0.90
                            )
                        );


                    outCanvas.width =
                        width;

                    outCanvas.height =
                        height;


                    ctx =
                        outCanvas.getContext(
                            "2d"
                        );


                    if(
                        format ===
                        "image/jpeg"
                    ){

                        ctx.fillStyle =
                            "#ffffff";

                        ctx.fillRect(
                            0,
                            0,
                            width,
                            height
                        );
                    }


                    ctx.drawImage(
                        sourceCanvas,
                        0,
                        0,
                        width,
                        height
                    );


                    blob =
                        await canvasToBlob(
                            outCanvas,
                            format,
                            0.70
                        );


                    attempts++;
                }

            }else{

                blob =
                    await canvasToBlob(
                        outCanvas,
                        format,
                        0.90
                    );
            }


        /* ================= DOWNLOAD ================= */

if(currentObjectURL){

    URL.revokeObjectURL(
        currentObjectURL
    );
}


currentObjectURL =
    URL.createObjectURL(
        blob
    );


const extension =
    format === "image/png"
        ? "png"
        : format === "image/webp"
            ? "webp"
            : "jpg";


result.innerHTML = `

    <div>

        <b>✅ Result Ready</b>

        <br><br>

        Size:
        ${width} × ${height} px

        <br>

        File Size:
        ${Math.round(
            blob.size / 1024
        )} KB

    </div>


    <a
        class="btn"
        href="${currentObjectURL}"
        download="SSODAYS-image.${extension}"
    >

        ⬇️ Download Image

    </a>

`;


status.innerText =
    "Image तैयार है ✅";

}
);


/* ================= CANVAS TO BLOB ================= */

function canvasToBlob(
    canvas,
    format,
    quality
){

    return new Promise(
        function(resolve){

            canvas.toBlob(
                function(blob){

                    resolve(blob);

                },
                format,
                quality
            );

        }
    );

}


})();
