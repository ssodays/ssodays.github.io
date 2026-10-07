/* =========================================================
   SSODAYS PDF EDITOR
   ========================================================= */

let pdfDocument = null;
let originalPdfBytes = null;

let currentZoom = 1;

let activeTool = null;

let pages = [];

let undoStack = [];

let selectedObject = null;

let drawing = false;

let currentDraw = null;

let pdfjs = null;


/* =========================================================
   ELEMENTS
   ========================================================= */

const pdfInput =
    document.getElementById("pdfInput");

const imageInput =
    document.getElementById("imageInput");

const pdfContainer =
    document.getElementById("pdfContainer");

const welcome =
    document.getElementById("welcome");

const statusBox =
    document.getElementById("status");

const pencilBtn =
    document.getElementById("pencilBtn");

const highlightBtn =
    document.getElementById("highlightBtn");

const textBtn =
    document.getElementById("textBtn");

const textSize =
    document.getElementById("textSize");

const undoBtn =
    document.getElementById("undoBtn");

const deleteBtn =
    document.getElementById("deleteBtn");

const zoomInBtn =
    document.getElementById("zoomInBtn");

const zoomOutBtn =
    document.getElementById("zoomOutBtn");

const downloadBtn =
    document.getElementById("downloadBtn");

const textPopup =
    document.getElementById("textPopup");

const textInput =
    document.getElementById("textInput");

const addTextBtn =
    document.getElementById("addTextBtn");

const cancelTextBtn =
    document.getElementById("cancelTextBtn");


/* =========================================================
   STATUS
   ========================================================= */

function setStatus(message){

    statusBox.innerText = message;

}


/* =========================================================
   LOAD PDF.JS
   ========================================================= */

async function loadPDFJS(){

    if(window.pdfjsLib){

        pdfjs = window.pdfjsLib;

        pdfjs.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        return pdfjs;

    }

    throw new Error(
        "PDF.js load नहीं हुआ।"
    );

}


/* =========================================================
   PDF SELECT
   ========================================================= */

pdfInput.addEventListener(
    "change",
    async function(){

        const file = this.files[0];

        if(!file){

            return;

        }


        if(file.type !== "application/pdf"){

            setStatus(
                "कृपया केवल PDF file चुनें।"
            );

            return;

        }


        try{

            setStatus(
                "PDF loading..."
            );


            originalPdfBytes =
                new Uint8Array(
                    await file.arrayBuffer()
                );


            await openPDF(
                originalPdfBytes
            );

        }catch(error){

            console.error(error);

            setStatus(
                "PDF open नहीं हो पाई।"
            );

        }

    }
);


/* =========================================================
   OPEN PDF
   ========================================================= */

async function openPDF(bytes){

    const pdfjsLib =
        await loadPDFJS();


    const loadingTask =
        pdfjsLib.getDocument({
            data:bytes
        });


    pdfDocument =
        await loadingTask.promise;


    pages = [];

    undoStack = [];

    selectedObject = null;

    currentZoom = 1;


    pdfContainer.innerHTML = "";

    welcome.style.display = "none";


    for(
        let pageNumber = 1;
        pageNumber <= pdfDocument.numPages;
        pageNumber++
    ){

        await renderPage(
            pageNumber
        );

    }


    setStatus(
        `${pdfDocument.numPages} page PDF ready ✅`
    );

}


/* =========================================================
   RENDER PAGE
   ========================================================= */

async function renderPage(pageNumber){

    const page =
        await pdfDocument.getPage(
            pageNumber
        );


    const viewport =
        page.getViewport({
            scale:currentZoom
        });


    const pageBox =
        document.createElement(
            "div"
        );


    pageBox.className =
        "pdf-page";


    pageBox.dataset.page =
        pageNumber;


    pageBox.style.width =
        viewport.width + "px";


    pageBox.style.height =
        viewport.height + "px";


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        viewport.width;


    canvas.height =
        viewport.height;


    canvas.style.width =
        viewport.width + "px";


    canvas.style.height =
        viewport.height + "px";


    pageBox.appendChild(
        canvas
    );


    const editCanvas =
        document.createElement(
            "canvas"
        );


    editCanvas.className =
        "edit-canvas";


    editCanvas.width =
        viewport.width;


    editCanvas.height =
        viewport.height;


    editCanvas.style.width =
        viewport.width + "px";


    editCanvas.style.height =
        viewport.height + "px";


    pageBox.appendChild(
        editCanvas
    );


    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "page-overlay";


    pageBox.appendChild(
        overlay
    );


    pdfContainer.appendChild(
        pageBox
    );


    const ctx =
        canvas.getContext(
            "2d"
        );


    await page.render({

        canvasContext:ctx,

        viewport:viewport

    }).promise;


    const pageData = {

        pageNumber:pageNumber,

        pageBox:pageBox,

        canvas:canvas,

        editCanvas:editCanvas,

        editCtx:
            editCanvas.getContext(
                "2d"
            ),

        overlay:overlay,

        width:viewport.width,

        height:viewport.height,

        drawings:[],

        highlights:[],

        texts:[],

        images:[]

    };


    pages.push(
        pageData
    );


    setupDrawing(
        pageData
    );

}


/* =========================================================
   DRAWING SETUP
   ========================================================= */

function setupDrawing(pageData){

    const canvas =
        pageData.editCanvas;


    canvas.addEventListener(
        "pointerdown",
        function(event){

            if(
                activeTool !== "pencil" &&
                activeTool !== "highlight"
            ){

                return;

            }


            event.preventDefault();

            drawing = true;


            const point =
                getCanvasPoint(
                    event,
                    canvas
                );


            currentDraw = {

                tool:activeTool,

                points:[point]

            };


            canvas.setPointerCapture(
                event.pointerId
            );

        }
    );


    canvas.addEventListener(
        "pointermove",
        function(event){

            if(!drawing){

                return;

            }


            if(!currentDraw){

                return;

            }


            const point =
                getCanvasPoint(
                    event,
                    canvas
                );


            currentDraw.points.push(
                point
            );


            drawCurrentLine(
                pageData,
                currentDraw
            );

        }
    );


    canvas.addEventListener(
        "pointerup",
        function(event){

            if(!drawing){

                return;

            }


            drawing = false;


            if(
                currentDraw &&
                currentDraw.points.length > 1
            ){

                saveUndoState();

                if(
                    currentDraw.tool ===
                    "pencil"
                ){

                    pageData.drawings.push(
                        currentDraw
                    );

                }else{

                    pageData.highlights.push(
                        currentDraw
                    );

                }

            }


            currentDraw = null;

            redrawPageAnnotations(
                pageData
            );

        }
    );


    canvas.addEventListener(
        "pointercancel",
        function(){

            drawing = false;

            currentDraw = null;

            redrawPageAnnotations(
                pageData
            );

        }
    );


    canvas.addEventListener(
        "click",
        function(event){

            if(activeTool !== "text"){

                return;

            }


            const point =
                getCanvasPoint(
                    event,
                    canvas
                );


            openTextPopup(
                pageData,
                point.x,
                point.y
            );

        }
    );

}


/* =========================================================
   GET CANVAS POINT
   ========================================================= */

function getCanvasPoint(
    event,
    canvas
){

    const rect =
        canvas.getBoundingClientRect();


    return {

        x:
            (event.clientX - rect.left) *
            (canvas.width / rect.width),

        y:
            (event.clientY - rect.top) *
            (canvas.height / rect.height)

    };

}


/* =========================================================
   DRAW CURRENT LINE
   ========================================================= */

function drawCurrentLine(
    pageData,
    line
){

    redrawPageAnnotations(
        pageData
    );


    const ctx =
        pageData.editCtx;


    if(line.points.length < 2){

        return;

    }


    ctx.save();


    if(
        line.tool ===
        "highlight"
    ){

        ctx.strokeStyle =
            "rgba(255,235,59,0.45)";

        ctx.lineWidth =
            18;

    }else{

        ctx.strokeStyle =
            "#000000";

        ctx.lineWidth =
            3;

    }


    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";


    ctx.beginPath();


    ctx.moveTo(
        line.points[0].x,
        line.points[0].y
    );


    for(
        let i = 1;
        i < line.points.length;
        i++
    ){

        ctx.lineTo(
            line.points[i].x,
            line.points[i].y
        );

    }


    ctx.stroke();

    ctx.restore();

}


/* =========================================================
   REDRAW ANNOTATIONS
   ========================================================= */

function redrawPageAnnotations(
    pageData
){

    const ctx =
        pageData.editCtx;


    ctx.clearRect(
        0,
        0,
        pageData.editCanvas.width,
        pageData.editCanvas.height
    );


    pageData.highlights.forEach(
        function(line){

            drawStoredLine(
                ctx,
                line,
                "highlight"
            );

        }
    );


    pageData.drawings.forEach(
        function(line){

            drawStoredLine(
                ctx,
                line,
                "pencil"
            );

        }
    );

}


/* =========================================================
   DRAW STORED LINE
   ========================================================= */

function drawStoredLine(
    ctx,
    line,
    type
){

    if(
        !line.points ||
        line.points.length < 2
    ){

        return;

    }


    ctx.save();


    if(type === "highlight"){

        ctx.strokeStyle =
            "rgba(255,235,59,0.45)";

        ctx.lineWidth =
            18;

    }else{

        ctx.strokeStyle =
            "#000000";

        ctx.lineWidth =
            3;

    }


    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";


    ctx.beginPath();


    ctx.moveTo(
        line.points[0].x,
        line.points[0].y
    );


    for(
        let i = 1;
        i < line.points.length;
        i++
    ){

        ctx.lineTo(
            line.points[i].x,
            line.points[i].y
        );

    }


    ctx.stroke();

    ctx.restore();

}


/* =========================================================
   TEXT TOOL
   ========================================================= */

textBtn.addEventListener(
    "click",
    function(){

        activateTool(
            "text"
        );

        setStatus(
            "PDF पर जहाँ text चाहिए वहाँ tap/click करें।"
        );

    }
);


/* =========================================================
   OPEN TEXT POPUP
   ========================================================= */

function openTextPopup(
    pageData,
    x,
    y
){

    selectedObject = {

        type:"newText",

        page:pageData,

        x:x,

        y:y

    };


    textInput.value = "";

    textPopup.style.display =
        "flex";


    setTimeout(
        function(){

            textInput.focus();

        },
        100
    );

}


/* =========================================================
   ADD TEXT
   ========================================================= */

addTextBtn.addEventListener(
    "click",
    function(){

        const value =
            textInput.value.trim();


        if(!value){

            return;

        }


        if(
            !selectedObject ||
            selectedObject.type !==
            "newText"
        ){

            return;

        }


        const pageData =
            selectedObject.page;


        saveUndoState();


        const textObject = {

            id:
                "text-" +
                Date.now(),

            text:value,

            x:
                selectedObject.x,

            y:
                selectedObject.y,

            size:
                parseInt(
                    textSize.value
                ) || 16

        };


        pageData.texts.push(
            textObject
        );


        createTextElement(
            pageData,
            textObject
        );


        closeTextPopup();


        setStatus(
            "Text add हो गया ✅"
        );

    }
);


/* =========================================================
   CANCEL TEXT
   ========================================================= */

cancelTextBtn.addEventListener(
    "click",
    function(){

        closeTextPopup();

    }
);


/* =========================================================
   CLOSE TEXT POPUP
   ========================================================= */

function closeTextPopup(){

    textPopup.style.display =
        "none";

    textInput.value = "";

    selectedObject = null;

}


/* =========================================================
   CREATE TEXT ELEMENT
   ========================================================= */

function createTextElement(
    pageData,
    textObject
){

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "pdf-text";


    element.dataset.id =
        textObject.id;


    element.innerText =
        textObject.text;


    element.style.left =
        textObject.x + "px";


    element.style.top =
        textObject.y + "px";


    element.style.fontSize =
        textObject.size + "px";


    pageData.overlay.appendChild(
        element
    );


    makeTextDraggable(
        pageData,
        element,
        textObject
    );


    element.addEventListener(
        "click",
        function(event){

            event.stopPropagation();

            selectObject(
                element
            );

        }
    );

}


/* =========================================================
   TEXT DRAG
   ========================================================= */

function makeTextDraggable(
    pageData,
    element,
    textObject
){

    let draggingText = false;

    let offsetX = 0;

    let offsetY = 0;


    element.addEventListener(
        "pointerdown",
        function(event){

            if(activeTool === "text"){

                return;

            }


            event.preventDefault();

            event.stopPropagation();


            saveUndoState();


            draggingText = true;


            const rect =
                element.getBoundingClientRect();


            offsetX =
                event.clientX -
                rect.left;


            offsetY =
                event.clientY -
                rect.top;


            element.setPointerCapture(
                event.pointerId
            );

        }
    );


    element.addEventListener(
        "pointermove",
        function(event){

            if(!draggingText){

                return;

            }


            const pageRect =
                pageData.pageBox.getBoundingClientRect();


            const x =
                event.clientX -
                pageRect.left -
                offsetX;


            const y =
                event.clientY -
                pageRect.top -
                offsetY;


            textObject.x =
                Math.max(
                    0,
                    Math.min(
                        pageData.width -
                        element.offsetWidth,
                        x
                    )
                );


            textObject.y =
                Math.max(
                    0,
                    Math.min(
                        pageData.height -
                        element.offsetHeight,
                        y
                    )
                );


            element.style.left =
                textObject.x + "px";


            element.style.top =
                textObject.y + "px";

        }
    );


    element.addEventListener(
        "pointerup",
        function(){

            draggingText = false;

        }
    );

}


/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

imageInput.addEventListener(
    "change",
    async function(){

        const file =
            this.files[0];


        if(!file){

            return;

        }


        if(
            !file.type.startsWith(
                "image/"
            )
        ){

            setStatus(
                "कृपया image file चुनें।"
            );

            return;

        }


        const pageData =
            getVisiblePage();


        if(!pageData){

            setStatus(
                "पहले PDF खोलें।"
            );

            return;

        }


        try{

            const dataURL =
                await fileToDataURL(
                    file
                );


            saveUndoState();


            const imageObject = {

                id:
                    "image-" +
                    Date.now(),

                src:dataURL,

                x:40,

                y:40,

                width:180,

                height:180

            };


            pageData.images.push(
                imageObject
            );


            createImageElement(
                pageData,
                imageObject
            );


            setStatus(
                "Image PDF में add हो गई ✅"
            );


        }catch(error){

            console.error(error);

            setStatus(
                "Image add नहीं हो पाई।"
            );

        }


        imageInput.value = "";

    }
);


/* =========================================================
   FILE TO DATA URL
   ========================================================= */

function fileToDataURL(
    file
){

    return new Promise(
      function(resolve,reject){

            const reader =
                new FileReader();


            reader.onload =
                function(){

                    resolve(
                        reader.result
                    );

                };


            reader.onerror =
                function(){

                    reject(
                        reader.error
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   CREATE IMAGE
   ========================================================= */

function createImageElement(
    pageData,
    imageObject
){

    const img =
        document.createElement(
            "img"
        );


    img.className =
        "pdf-image";


    img.dataset.id =
        imageObject.id;


    img.src =
        imageObject.src;


    img.draggable =
        false;


    img.style.left =
        imageObject.x + "px";


    img.style.top =
        imageObject.y + "px";


    img.style.width =
        imageObject.width + "px";


    img.style.height =
        imageObject.height + "px";


    pageData.overlay.appendChild(
        img
    );


    makeImageDraggable(
        pageData,
        img,
        imageObject
    );


    img.addEventListener(
        "click",
        function(event){

            event.stopPropagation();

            selectObject(
                img
            );

        }
    );

}


/* =========================================================
   IMAGE DRAG
   ========================================================= */

function makeImageDraggable(
    pageData,
    img,
    imageObject
){

    let dragging = false;

    let offsetX = 0;

    let offsetY = 0;


    img.addEventListener(
        "pointerdown",
        function(event){

            if(activeTool){

                return;

            }


            event.preventDefault();

            event.stopPropagation();


            saveUndoState();


            dragging = true;


            const rect =
                img.getBoundingClientRect();


            offsetX =
                event.clientX -
                rect.left;


            offsetY =
                event.clientY -
                rect.top;


            img.setPointerCapture(
                event.pointerId
            );

        }
    );


    img.addEventListener(
        "pointermove",
        function(event){

            if(!dragging){

                return;

            }


            const pageRect =
                pageData.pageBox.getBoundingClientRect();


            const x =
                event.clientX -
                pageRect.left -
                offsetX;


            const y =
                event.clientY -
                pageRect.top -
                offsetY;


            imageObject.x =
                Math.max(
                    0,
                    Math.min(
                        pageData.width -
                        imageObject.width,
                        x
                    )
                );


            imageObject.y =
                Math.max(
                    0,
                    Math.min(
                        pageData.height -
                        imageObject.height,
                        y
                    )
                );


            img.style.left =
                imageObject.x + "px";


            img.style.top =
                imageObject.y + "px";

        }
    );


    img.addEventListener(
        "pointerup",
        function(){

            dragging = false;

        }
    );

}


/* =========================================================
   SELECT OBJECT
   ========================================================= */

function selectObject(
    element
){

    document
        .querySelectorAll(
            ".pdf-text.selected, .pdf-image.selected"
        )
        .forEach(
            function(item){

                item.classList.remove(
                    "selected"
                );

            }
        );


    element.classList.add(
        "selected"
    );


    selectedObject =
        element;


    setStatus(
        "Object selected. Delete button से हटाएँ।"
    );

}


/* =========================================================
   DELETE SELECTED OBJECT
   ========================================================= */

deleteBtn.addEventListener(
    "click",
    function(){

        if(!selectedObject){

            setStatus(
                "पहले Text या Image select करें।"
            );

            return;

        }


        const element =
            selectedObject;


        const pageData =
            findPageForElement(
                element
            );


        if(!pageData){

            return;

        }


        saveUndoState();


        const id =
            element.dataset.id;


        pageData.texts =
            pageData.texts.filter(
                function(item){

                    return item.id !== id;

                }
            );


        pageData.images =
            pageData.images.filter(
                function(item){

                    return item.id !== id;

                }
            );


        element.remove();


        selectedObject =
            null;


        setStatus(
            "Object delete हो गया ✅"
        );

    }
);


/* =========================================================
   FIND PAGE
   ========================================================= */

function findPageForElement(
    element
){

    for(
        const pageData of pages
    ){

        if(
            pageData.overlay.contains(
                element
            )
        ){

            return pageData;

        }

    }


    return null;

}


/* =========================================================
   GET VISIBLE PAGE
   ========================================================= */

function getVisiblePage(){

    if(!pages.length){

        return null;

    }


    const center =
        window.innerHeight / 2;


    let bestPage =
        pages[0];


    let bestDistance =
        Infinity;


    pages.forEach(
        function(pageData){

            const rect =
                pageData.pageBox.getBoundingClientRect();


            const pageCenter =
                rect.top +
                rect.height / 2;


            const distance =
                Math.abs(
                    pageCenter -
                    center
                );


            if(
                distance <
                bestDistance
            ){

                bestDistance =
                    distance;

                bestPage =
                    pageData;

            }

        }
    );


    return bestPage;

}


/* =========================================================
   PENCIL
   ========================================================= */

pencilBtn.addEventListener(
    "click",
    function(){

        activateTool(
            "pencil"
        );

        setStatus(
            "✏️ Pencil चालू है। PDF पर उंगली/माउस से draw करें।"
        );

    }
);


/* =========================================================
   HIGHLIGHT
   ========================================================= */

highlightBtn.addEventListener(
    "click",
    function(){

        activateTool(
            "highlight"
        );

        setStatus(
            "🖍️ Highlight चालू है। PDF पर draw करें।"
        );

    }
);


/* =========================================================
   ACTIVATE TOOL
   ========================================================= */

function activateTool(
    tool
){

    activeTool =
        tool;


    [
        pencilBtn,
        highlightBtn,
        textBtn
    ].forEach(
        function(button){

            button.classList.remove(
                "active"
            );

        }
    );


    if(tool === "pencil"){

        pencilBtn.classList.add(
            "active"
        );

    }


    if(tool === "highlight"){

        highlightBtn.classList.add(
            "active"
        );

    }


    if(tool === "text"){

        textBtn.classList.add(
            "active"
        );

    }

}


/* =========================================================
   UNDO
   ========================================================= */

undoBtn.addEventListener(
    "click",
    function(){

        if(
            undoStack.length === 0
        ){

            setStatus(
                "Undo करने के लिए कुछ नहीं है।"
            );

            return;

        }


        const previous =
            undoStack.pop();


        restoreState(
            previous
        );


        setStatus(
            "Undo ✅"
        );

    }
);


/* =========================================================
   SAVE UNDO STATE
   ========================================================= */

function saveUndoState(){

    const state =
        pages.map(
            function(page){

                return {

                    pageNumber:
                        page.pageNumber,

                    drawings:
                        JSON.parse(
                            JSON.stringify(
                                page.drawings
                            )
                        ),

                    highlights:
                        JSON.parse(
                            JSON.stringify(
                                page.highlights
                            )
                        ),

                    texts:
                        JSON.parse(
                            JSON.stringify(
                                page.texts
                            )
                        ),

                    images:
                        JSON.parse(
                            JSON.stringify(
                                page.images
                            )
                        )

                };

            }
        );


    undoStack.push(
        state
    );


    if(
        undoStack.length > 30
    ){

        undoStack.shift();

    }

}


/* =========================================================
   RESTORE STATE
   ========================================================= */

function restoreState(
    state
){

    state.forEach(
        function(saved){

            const pageData =
                pages.find(
                    function(page){

                        return page.pageNumber ===
                            saved.pageNumber;

                    }
                );


            if(!pageData){

                return;

            }


            pageData.drawings =
                saved.drawings;


            pageData.highlights =
                saved.highlights;


            pageData.texts =
                saved.texts;


            pageData.images =
                saved.images;


            pageData.overlay.innerHTML =
                "";


            pageData.texts.forEach(
                function(item){

                    createTextElement(
                        pageData,
                        item
                    );

                }
            );


            pageData.images.forEach(
                function(item){

                    createImageElement(
                        pageData,
                        item
                    );

                }
            );


            redrawPageAnnotations(
                pageData
            );

        }
    );


    selectedObject =
        null;

}


/* =========================================================
   ZOOM IN
   ========================================================= */

zoomInBtn.addEventListener(
    "click",
    function(){

        if(!pdfDocument){

            return;

        }


        currentZoom =
            Math.min(
                3,
                currentZoom + 0.20
            );


        rerenderPDF();

    }
);


/* =========================================================
   ZOOM OUT
   ========================================================= */

zoomOutBtn.addEventListener(
    "click",
    function(){

        if(!pdfDocument){

            return;

        }


        currentZoom =
            Math.max(
                0.50,
                currentZoom - 0.20
            );


        rerenderPDF();

    }
);


/* =========================================================
   RERENDER PDF
   ========================================================= */

async function rerenderPDF(){

    setStatus(
        "Zoom बदल रहा है..."
    );


    const savedState =
        pages.map(
            function(page){

                return {

                    pageNumber:
                        page.pageNumber,

                    drawings:
                        page.drawings,

                    highlights:
                        page.highlights,

                    texts:
                        page.texts,

                    images:
                        page.images

                };

            }
        );


    pdfContainer.innerHTML =
        "";

    pages = [];


    for(
        let pageNumber = 1;
        pageNumber <= pdfDocument.numPages;
        pageNumber++
    ){

        await renderPage(
            pageNumber
        );

    }


    savedState.forEach(
        function(saved){

            const pageData =
                pages.find(
                    function(page){

                        return page.pageNumber ===
                            saved.pageNumber;

                    }
                );


            if(!pageData){

                return;

            }


            pageData.drawings =
                saved.drawings;


            pageData.highlights =
                saved.highlights;


            pageData.texts =
                saved.texts;


            pageData.images =
                saved.images;


            pageData.overlay.innerHTML =
                "";


            pageData.texts.forEach(
                function(item){

                    createTextElement(
                        pageData,
                        item
                    );

                }
            );


            pageData.images.forEach(
                function(item){

                    createImageElement(
                        pageData,
                        item
                    );

                }
            );


            redrawPageAnnotations(
                pageData
            );

        }
    );


    setStatus(
        "Zoom " +
        Math.round(
            currentZoom * 100
        ) +
        "% ✅"
    );

}


/* =========================================================
   DOWNLOAD EDITED PDF
   ========================================================= */

downloadBtn.addEventListener(
    "click",
    async function(){

        if(!originalPdfBytes){

            setStatus(
                "पहले PDF चुनें।"
            );

            return;

        }


        try{

            setStatus(
                "Edited PDF तैयार हो रही है..."
            );


            const pdfDoc =
                await PDFLib.PDFDocument.load(
                    originalPdfBytes
                );


            const pdfPages =
                pdfDoc.getPages();


            for(
                let i = 0;
                i < pages.length;
                i++
            ){

                const pageData =
                    pages[i];


                const pdfPage =
                    pdfPages[i];


                const pdfWidth =
                    pdfPage.getWidth();


                const pdfHeight =
                    pdfPage.getHeight();


                const scaleX =
                    pdfWidth /
                    pageData.width;


                const scaleY =
                    pdfHeight /
                    pageData.height;


                for(
                    const line of
                    pageData.drawings
                ){

                    drawPDFLine(
                        pdfPage,
                        line,
                        scaleX,
                        scaleY,
                        false
                    );

                }


                for(
                    const line of
                    pageData.highlights
                ){

                    drawPDFLine(
                        pdfPage,
                        line,
                        scaleX,
                        scaleY,
                        true
                    );

                }


                for(
                    const text of
                    pageData.texts
                ){

                    const fontSize =
                        text.size *
                        scaleX;


                    const x =
                        text.x *
                        scaleX;


                    const y =
                        pdfHeight -
                        (
                            text.y *
                            scaleY
                        ) -
                        fontSize;


                    pdfPage.drawText(
                        text.text,
                        {

                            x:x,

                            y:y,

                            size:fontSize,

                            color:
                                PDFLib.rgb(
                                    0,
                                    0,
                                    0
                                )

                        }
                    );

                }


                for(
                    const image of
                    pageData.images
                ){

                    await drawPDFImage(
                        pdfDoc,
                        pdfPage,
                        image,
                        scaleX,
                        scaleY,
                        pdfHeight
                    );

                }

            }


            const finalBytes =
                await pdfDoc.save();


            const blob =
                new Blob(
                    [
                        finalBytes
                    ],
                    {
                        type:
                            "application/pdf"
                    }
                );


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                "SSODAYS-Edited-PDF.pdf";


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            setTimeout(
                function(){

                    URL.revokeObjectURL(
                        url
                    );

                },
                1000
            );


            setStatus(
                "Edited PDF Download हो गई ✅"
            );


        }catch(error){

            console.error(error);

            setStatus(
                "PDF Download करते समय error आया।"
            );

        }

    }
);


/* =========================================================
   DRAW PDF LINE
   ========================================================= */

function drawPDFLine(
    pdfPage,
    line,
    scaleX,
    scaleY,
    highlight
){

    if(
        !line.points ||
        line.points.length < 2
    ){

        return;

    }


    const width =
        (
            highlight ?
            18 :
            3
        ) *
        scaleX;


    const color =
        highlight ?
        PDFLib.rgb(
            1,
            0.9,
            0
                ) :
        PDFLib.rgb(
            0,
            0,
            0
        );


    const opacity =
        highlight ?
        0.40 :
        1;


    for(
        let i = 1;
        i < line.points.length;
        i++
    ){

        const p1 =
            line.points[i - 1];


        const p2 =
            line.points[i];


        pdfPage.drawLine({

            start:{

                x:
                    p1.x *
                    scaleX,

                y:
                    pdfPage.getHeight() -
                    (
                        p1.y *
                        scaleY
                    )

            },

            end:{

                x:
                    p2.x *
                    scaleX,

                y:
                    pdfPage.getHeight() -
                    (
                        p2.y *
                        scaleY
                    )

            },

            thickness:
                width,

            color:
                color,

            opacity:
                opacity

        });

    }

}


/* =========================================================
   DRAW IMAGE INTO PDF
   ========================================================= */

async function drawPDFImage(
    pdfDoc,
    pdfPage,
    image,
    scaleX,
    scaleY,
    pdfHeight
){

    try{

        let embeddedImage;


        if(
            image.src.startsWith(
                "data:image/png"
            )
        ){

            embeddedImage =
                await pdfDoc.embedPng(
                    image.src
                );

        }else{

            embeddedImage =
                await pdfDoc.embedJpg(
                    image.src
                );

        }


        pdfPage.drawImage(
            embeddedImage,
            {

                x:
                    image.x *
                    scaleX,

                y:
                    pdfHeight -
                    (
                        (
                            image.y +
                            image.height
                        ) *
                        scaleY
                    ),

                width:
                    image.width *
                    scaleX,

                height:
                    image.height *
                    scaleY

            }
        );

    }catch(error){

        console.error(
            "Image PDF error:",
            error
        );

    }

}


/* =========================================================
   PAGE CLEANUP
   ========================================================= */

window.addEventListener(
    "beforeunload",
    function(){

        originalPdfBytes =
            null;

        pdfDocument =
            null;

        pages =
            [];

        undoStack =
            [];

    }
);


/* =========================================================
   CLICK OUTSIDE OBJECT
   ========================================================= */

document.addEventListener(
    "click",
    function(event){

        if(
            !event.target.closest(
                ".pdf-text"
            ) &&
            !event.target.closest(
                ".pdf-image"
            )
        ){

            document
                .querySelectorAll(
                    ".pdf-text.selected, .pdf-image.selected"
                )
                .forEach(
                    function(item){

                        item.classList.remove(
                            "selected"
                        );

                    }
                );

            selectedObject =
                null;

        }

    }
);


/* =========================================================
   INITIAL STATUS
   ========================================================= */

setStatus(
    "📤 PDF चुनें"
);
