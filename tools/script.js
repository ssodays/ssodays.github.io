/* ================================================= */
/* =============== IMAGE TOOLS ===================== */
/* ================================================= */

let cropper = null;

let currentRotation = 0;

let selectedObjectURL = null;

let finalImageCanvas = null;

let finalDownloadURL = null;


/* ================================================= */
/* ================= ELEMENTS ======================= */
/* ================================================= */

const imageInput =
    document.getElementById("imageInput");

const imageEditor =
    document.getElementById("imageEditor");

const imageEditorArea =
    document.getElementById("imageEditorArea");

const editImage =
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

const resultCard =
    document.getElementById("resultCard");

const croppedPreview =
    document.getElementById("croppedPreview");

const imageWidth =
    document.getElementById("imageWidth");

const imageHeight =
    document.getElementById("imageHeight");

const imageFormat =
    document.getElementById("imageFormat");

const targetKB =
    document.getElementById("targetKB");

const processImageBtn =
    document.getElementById("processImageBtn");

const toolStatus =
    document.getElementById("toolStatus");

const toolResult =
    document.getElementById("toolResult");


/* ================================================= */
/* ================ PHOTO SELECT =================== */
/* ================================================= */

imageInput.addEventListener(
    "change",
    function(){

        const file =
            this.files[0];

        if(!file){

            return;

        }


        if(!file.type.startsWith("image/")){

            toolStatus.innerText =
                "कृपया image file चुनें।";

            return;

        }


        /* पुराने Cropper को हटाएँ */

        if(cropper){

            cropper.destroy();

            cropper = null;

        }


        /* पुराने URL को हटाएँ */

        if(selectedObjectURL){

            URL.revokeObjectURL(
                selectedObjectURL
            );

        }


        selectedObjectURL =
            URL.createObjectURL(file);


        editImage.src =
            selectedObjectURL;


        imageEditor.style.display =
            "block";


        resultCard.style.display =
            "none";


        toolResult.innerHTML =
            "";


        finalImageCanvas =
            null;


        currentRotation =
            0;


        rotateSlider.value =
            0;


        rotateValue.innerText =
            "0";


        editImage.onload =
            function(){

                createCropper();

            };

    }
);


/* ================================================= */
/* ================ CREATE CROPPER ================== */
/* ================================================= */

function createCropper(){

    if(cropper){

        cropper.destroy();

        cropper = null;

    }


    cropper =
        new Cropper(
            editImage,
            {

                viewMode:1,

                dragMode:"move",

                autoCrop:true,

                autoCropArea:0.80,

                responsive:true,

                restore:true,

                guides:true,

                center:true,

                highlight:true,

                cropBoxMovable:true,

                cropBoxResizable:true,

                toggleDragModeOnDblclick:false,


                /* हाथ से zoom */

                zoomOnWheel:true,

                zoomOnTouch:true,

                zoomable:true,

                movable:true,


                background:false,

                aspectRatio:NaN,


                ready:function(){

                    toolStatus.innerText =
                        "Photo तैयार है। Crop box को adjust करें। हाथ से या buttons से zoom कर सकते हैं।";

                }

            }

        );

}


/* ================================================= */
/* ================= ROTATE LEFT =================== */
/* ================================================= */

rotateLeftBtn.addEventListener(
    "click",
    function(){

        if(!cropper){

            return;

        }


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


/* ================================================= */
/* ================= ROTATE RIGHT ================== */
/* ================================================= */

rotateRightBtn.addEventListener(
    "click",
    function(){

        if(!cropper){

            return;

        }


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


/* ================================================= */
/* ================ ROTATION SLIDER ================ */
/* ================================================= */

rotateSlider.addEventListener(
    "input",
    function(){

        if(!cropper){

            return;

        }


        currentRotation =
            parseInt(
                this.value
            );


        cropper.rotateTo(
            currentRotation
        );


        rotateValue.innerText =
            currentRotation;

    }
);


/* ================================================= */
/* ================== ZOOM IN ====================== */
/* ================================================= */

zoomInBtn.addEventListener(
    "click",
    function(){

        if(!cropper){

            return;

        }


        cropper.zoom(
            0.10
        );

    }
);


/* ================================================= */
/* ================== ZOOM OUT ===================== */
/* ================================================= */

zoomOutBtn.addEventListener(
    "click",
    function(){

        if(!cropper){

            return;

        }


        cropper.zoom(
            -0.10
        );

    }
);


/* ================================================= */
/* ===================== RESET ===================== */
/* ================================================= */

resetEditorBtn.addEventListener(
    "click",
    function(){

        if(!cropper){

            return;

        }


        cropper.reset();


        currentRotation =
            0;


        rotateSlider.value =
            0;


        rotateValue.innerText =
            "0";


        toolStatus.innerText =
            "Editor reset हो गया।";

    }
);


/* ================================================= */
/* ================= APPLY CROP ==================== */
/* ================================================= */

applyCropBtn.addEventListener(
    "click",
    function(){

        if(!cropper){

            toolStatus.innerText =
                "पहले photo चुनें।";

            return;

        }


        const croppedCanvas =
            cropper.getCroppedCanvas({

                imageSmoothingEnabled:true,

                imageSmoothingQuality:"high"

            });


        if(!croppedCanvas){

            toolStatus.innerText =
                "Crop नहीं हो पाया।";

            return;

        }


        /* Cropped canvas save */

        finalImageCanvas =
            croppedCanvas;


        /* Original dimensions */

        imageWidth.value =
            croppedCanvas.width;


        imageHeight.value =
            croppedCanvas.height;


        /* Result box show */

        resultCard.style.display =
            "block";


        /* Cropped preview */

        if(finalDownloadURL){

            URL.revokeObjectURL(
                finalDownloadURL
            );

        }


        croppedCanvas.toBlob(
            function(blob){

                finalDownloadURL =
                    URL.createObjectURL(
                        blob
                    );


                croppedPreview.src =
                    finalDownloadURL;

            },
            "image/png"
        );


        toolStatus.innerText =
            "Crop complete ✅ अब नीचे Width, Height और Target KB सेट करें।";


        /* Result box तक जाएँ */

        setTimeout(
            function(){

                resultCard.scrollIntoView({
                    behavior:"smooth",
                    block:"start"
                });

            },
            200
        );

    }
);


/* ================================================= */
/* ================ PROCESS IMAGE =================== */
/* ================================================= */

processImageBtn.addEventListener(
    "click",
    async function(){

        if(!finalImageCanvas){

            toolStatus.innerText =
                "पहले Apply Crop करें।";

            return;

        }


        let width =
            parseInt(
                imageWidth.value
            );


        let height =
            parseInt(
                imageHeight.value
            );


        if(!width || width < 1){

            width =
                finalImageCanvas.width;

        }


        if(!height || height < 1){

            height =
                finalImageCanvas.height;

        }


        const format =
            imageFormat.value;


        const wantedKB =
            parseFloat(
                targetKB.value
            );


        /* PNG Target KB */

        if(
            format === "image/png" &&
            wantedKB
        ){

            toolStatus.innerText =
                "PNG में Target KB compression reliable नहीं है। JPG या WEBP चुनें।";

            return;

        }


        let outputCanvas =
            document.createElement(
                "canvas"
            );


        outputCanvas.width =
            width;


        outputCanvas.height =
            height;


        let ctx =
            outputCanvas.getContext(
                "2d"
            );


        drawCanvas(
            outputCanvas,
            ctx,
            width,
            height,
            format
        );


        let quality =
            0.92;


        let blob =
            await canvasToBlob(
                outputCanvas,
                format,
                quality
            );


        /* ================================================= */
        /* TARGET KB COMPRESSION */
        /* ================================================= */

        if(
            wantedKB &&
            (
                format === "image/jpeg" ||
                format === "image/webp"
            )
        ){

            const targetBytes =
                wantedKB * 1024;


            /* पहले quality कम करें */

            for(
                let i = 0;
                i < 20;
                i++
            ){

                if(
                    blob.size <= targetBytes
                ){

                    break;

                }


                quality -=
                    0.04;


                if(quality < 0.05){

                    quality =
                        0.05;

                }


                blob =
                    await canvasToBlob(
                        outputCanvas,
                        format,
                        quality
                    );

            }


            /* ================================================= */
            /* जरूरत पड़े तो dimensions भी कम करें */
            /* ================================================= */

            let attempts =
                0;


            while(
                blob.size > targetBytes &&
                attempts < 25
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


                outputCanvas.width =
                    width;


                outputCanvas.height =
                    height;


                ctx =
                    outputCanvas.getContext(
                        "2d"
                    );


                drawCanvas(
                    outputCanvas,
                    ctx,
                    width,
                    height,
                    format
                );


                blob =
                    await canvasToBlob(
                        outputCanvas,
                        format,
                        0.75
                    );


                attempts++;

            }

        }


        /* ================================================= */
        /* UPDATE INPUT SIZE */
        /* ================================================= */

        imageWidth.value =
            width;


        imageHeight.value =
            height;


        /* ================================================= */
        /* DOWNLOAD URL */
        /* ================================================= */

        if(finalDownloadURL){

            URL.revokeObjectURL(
                finalDownloadURL
            );

        }


        finalDownloadURL =
            URL.createObjectURL(
                blob
            );


        /* ================================================= */
        /* PREVIEW */
        /* ================================================= */

        croppedPreview.src =
            finalDownloadURL;


        /* ================================================= */
        /* EXTENSION */
        /* ================================================= */

        let extension =
            "jpg";


        if(format === "image/png"){

            extension =
                "png";

        }


        if(format === "image/webp"){

            extension =
                "webp";

        }


        /* ================================================= */
        /* RESULT BOX */
        /* ================================================= */

        toolResult.innerHTML = `

            <div>

                <b>
                    ✅ Final Image Ready
                </b>

                <br><br>

                Size:
                ${width} × ${height} px

                <br>

                File Size:
                ${Math.round(blob.size / 1024)} KB

            </div>


            <a
                class="btn"
                href="${finalDownloadURL}"
                download="SSODAYS-image.${extension}"
            >
                ⬇️ Download Image
            </a>

        `;


        /* ================================================= */
        /* STATUS */
        /* ================================================= */

        if(
            wantedKB &&
            blob.size > wantedKB * 1024
        ){

            toolStatus.innerText =
                "Image तैयार है ✅ लेकिन Target KB से थोड़ा ज्यादा है।";

        }else{

            toolStatus.innerText =
                "Image तैयार है और Download के लिए उपलब्ध है ✅";

        }


        /* Preview तक scroll */

        setTimeout(
            function(){

                resultCard.scrollIntoView({
                    behavior:"smooth",
                    block:"start"
                });

            },
            200
        );

    }
);


/* ================================================= */
/* ================= DRAW CANVAS =================== */
/* ================================================= */

function drawCanvas(
    canvas,
    ctx,
    width,
    height,
    format
){

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    /* JPG में white background */

    if(
        format === "image/jpeg"
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
        finalImageCanvas,
        0,
        0,
        width,
        height
    );

}


/* ================================================= */
/* ================= CANVAS TO BLOB ================ */
/* ================================================= */

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


/* ================================================= */
/* ================= PAGE CLEANUP =================== */
/* ================================================= */

window.addEventListener(
    "beforeunload",
    function(){

        if(selectedObjectURL){

            URL.revokeObjectURL(
                selectedObjectURL
            );

        }


        if(finalDownloadURL){

            URL.revokeObjectURL(
                finalDownloadURL
            );

        }

    }
);
