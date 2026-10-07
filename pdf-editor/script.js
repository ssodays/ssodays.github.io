/* =========================================================
   SSODAYS PDF VIEWER
   ========================================================= */

let pdfDocument = null;
let originalPdfBytes = null;

let currentZoom = 1;
let currentPage = 1;

let activeTool = null;

let pages = [];

let drawing = false;
let drawStartX = 0;
let drawStartY = 0;
let currentDrawing = null;

let selectedPage = null;
let selectedX = 0;
let selectedY = 0;


/* =========================================================
   PDF.JS SETUP
   ========================================================= */

const pdfjsLib = window.pdfjsLib;

if(pdfjsLib){

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

}


/* =========================================================
   DOM
   ========================================================= */

const pdfInput =
    document.getElementById("pdfInput");

const imageInput =
    document.getElementById("imageInput");

const pdfContainer =
    document.getElementById("pdfContainer");

const viewerContainer =
    document.getElementById("viewerContainer");

const welcome =
    document.getElementById("welcome");

const statusBox =
    document.getElementById("status");

const pageNumber =
    document.getElementById("pageNumber");

const pageCount =
    document.getElementById("pageCount");

const zoomIn =
    document.getElementById("zoomIn");

const zoomOut =
    document.getElementById("zoomOut");

const closeBtn =
    document.getElementById("closeBtn");

const searchBtn =
    document.getElementById("searchBtn");

const searchBox =
    document.getElementById("searchBox");

const searchInput =
    document.getElementById("searchInput");

const searchClose =
    document.getElementById("searchClose");

const searchNext =
    document.getElementById("searchNext");

const searchPrev =
    document.getElementById("searchPrev");

const pencilBtn =
    document.getElementById("pencilBtn");

const highlightBtn =
    document.getElementById("highlightBtn");

const textBtn =
    document.getElementById("textBtn");

const imageInputElement =
    document.getElementById("imageInput");

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

    if(statusBox){

        statusBox.textContent =
            message;

    }

}


/* =========================================================
   PDF SELECT
   ========================================================= */

pdfInput.addEventListener(
    "change",
    async function(){

        const file =
            this.files[0];

        if(!file){

            return;

        }

        if(
            file.type !== "application/pdf" &&
            !file.name.toLowerCase().endsWith(".pdf")
        ){

            setStatus("कृपया PDF file चुनें।");

            return;

        }

        try{

            setStatus("PDF loading...");

            const buffer =
                await file.arrayBuffer();

            originalPdfBytes =
                new Uint8Array(buffer);

            await openPDF(
                originalPdfBytes
            );

        }
        catch(error){

            console.error(error);

            setStatus(
                "PDF open error: " +
                error.message
            );

        }

    }
);


/* =========================================================
   OPEN PDF
   ========================================================= */

async function openPDF(bytes){

    if(!pdfjsLib){

        throw new Error(
            "PDF.js load नहीं हुआ।"
        );

    }

    pdfContainer.innerHTML = "";

    pages = [];

    currentZoom = 1;

    currentPage = 1;

    const loadingTask =
        pdfjsLib.getDocument({
            data: bytes
        });

    pdfDocument =
        await loadingTask.promise;

    pageCount.textContent =
        "/ " + pdfDocument.numPages;

    pageNumber.value =
        1;

    if(welcome){

        welcome.style.display =
            "none";

    }

    setStatus(
        pdfDocument.numPages +
        " pages loaded"
    );

    await renderAllPages();

    setStatus("PDF ready");

}


/* =========================================================
   RENDER ALL PAGES
   ========================================================= */

async function renderAllPages(){

    pdfContainer.innerHTML = "";

    pages = [];

    for(
        let pageNo = 1;
        pageNo <= pdfDocument.numPages;
        pageNo++
    ){

        await renderPage(
            pageNo
        );

    }

}


/* =========================================================
   RENDER PAGE
   ========================================================= */

async function renderPage(pageNo){

    const page =
        await pdfDocument.getPage(
            pageNo
        );


    /*
       High quality rendering.

       Device pixel ratio makes text
       sharper on mobile screens.
    */

    const outputScale =
        Math.max(
            window.devicePixelRatio || 1,
            2
        );


    const viewport =
        page.getViewport({
            scale: currentZoom
        });


    const canvas =
        document.createElement(
            "canvas"
        );

    const context =
        canvas.getContext(
            "2d"
        );


    canvas.width =
        Math.floor(
            viewport.width *
            outputScale
        );

    canvas.height =
        Math.floor(
            viewport.height *
            outputScale
        );


    canvas.style.width =
        Math.floor(
            viewport.width
        ) + "px";


    canvas.style.height =
        Math.floor(
            viewport.height
        ) + "px";


    context.setTransform(
        outputScale,
        0,
        0,
        outputScale,
        0,
        0
    );


    const pageDiv =
        document.createElement(
            "div"
        );

    pageDiv.className =
        "pdf-page";


    pageDiv.dataset.page =
        pageNo;


    pageDiv.style.width =
        viewport.width + "px";


    pageDiv.style.height =
        viewport.height + "px";


    pageDiv.appendChild(
        canvas
    );


    /*
       Editing overlay
    */

    const editCanvas =
        document.createElement(
            "canvas"
        );

    editCanvas.className =
        "edit-canvas";


    editCanvas.width =
        Math.floor(
            viewport.width
        );

    editCanvas.height =
        Math.floor(
            viewport.height
        );


    editCanvas.style.width =
        viewport.width + "px";

    editCanvas.style.height =
        viewport.height + "px";


    pageDiv.appendChild(
        editCanvas
    );


    pdfContainer.appendChild(
        pageDiv
    );


    await page.render({

        canvasContext:
            context,

        viewport:
            viewport

    }).promise;


    setupDrawing(
        editCanvas,
        pageDiv,
        pageNo
    );


    pages.push({

        pageNo:
            pageNo,

        pageDiv:
            pageDiv,

        canvas:
            canvas,

        editCanvas:
            editCanvas

    });

}


/* =========================================================
   DRAWING
   ========================================================= */

function setupDrawing(
    canvas,
    pageDiv,
    pageNo
){

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

            canvas.setPointerCapture(
                event.pointerId
            );


            const rect =
                canvas.getBoundingClientRect();


            drawStartX =
                event.clientX -
                rect.left;

            drawStartY =
                event.clientY -
                rect.top;


            currentDrawing =
                document.createElement(
                    "div"
                );


            currentDrawing.style.position =
                "absolute";


            currentDrawing.style.left =
                drawStartX + "px";


            currentDrawing.style.top =
                drawStartY + "px";


            currentDrawing.style.pointerEvents =
                "none";


            currentDrawing.style.zIndex =
                "100";


            if(
                activeTool ===
                "highlight"
            ){

                currentDrawing.className =
                    "highlight-mark";

                currentDrawing.style.background =
                    "rgba(255,235,59,0.45)";

            }
            else{

                currentDrawing.style.height =
                    "3px";

                currentDrawing.style.background =
                    "#111";

                currentDrawing.style.transformOrigin =
                    "0 50%";

            }


            pageDiv.appendChild(
                currentDrawing
            );

        }
    );


    canvas.addEventListener(
        "pointermove",
        function(event){

            if(!drawing){

                return;

            }


            const rect =
                canvas.getBoundingClientRect();


            const x =
                event.clientX -
                rect.left;

            const y =
                event.clientY -
                rect.top;


            const width =
                x - drawStartX;

            const height =
                y - drawStartY;


            if(
                activeTool ===
                "highlight"
            ){

                currentDrawing.style.width =
                    Math.abs(width) + "px";


                currentDrawing.style.height =
                    "18px";


                currentDrawing.style.left =
                    Math.min(
                        drawStartX,
                        x
                    ) + "px";


                currentDrawing.style.top =
                    Math.min(
                        drawStartY,
                        y
                    ) + "px";

            }
            else{

                const length =
                    Math.sqrt(
                        width * width +
                        height * height
                    );


                const angle =
                    Math.atan2(
                        height,
                        width
                    ) *
                    180 /
                    Math.PI;


                currentDrawing.style.width =
                    length + "px";


                currentDrawing.style.transform =
                    "rotate(" +
                    angle +
                    "deg)";

            }

        }
    );


    canvas.addEventListener(
        "pointerup",
        function(){

            drawing = false;

            currentDrawing = null;

        }
    );


    canvas.addEventListener(
        "pointercancel",
        function(){

            drawing = false;

            currentDrawing = null;

        }
    );

}


/* =========================================================
   TOOL BUTTONS
   ========================================================= */

function activateTool(tool){

    activeTool =
        activeTool === tool
            ? null
            : tool;


    pencilBtn.classList.remove(
        "active"
    );

    highlightBtn.classList.remove(
        "active"
    );

    textBtn.classList.remove(
        "active"
    );


    if(activeTool === "pencil"){

        pencilBtn.classList.add(
            "active"
        );

    }


    if(activeTool === "highlight"){

        highlightBtn.classList.add(
            "active"
        );

    }


    if(activeTool === "text"){

        textBtn.classList.add(
            "active"
        );

    }

}


pencilBtn.addEventListener(
    "click",
    function(){

        activateTool(
            "pencil"
        );

    }
);


highlightBtn.addEventListener(
    "click",
    function(){

        activateTool(
            "highlight"
        );

    }
);


textBtn.addEventListener(
    "click",
    function(){

        activateTool(
            "text"
        );

    }
);


/* =========================================================
   TEXT TOOL
   ========================================================= */

pdfContainer.addEventListener(
    "click",
    function(event){

        if(
            activeTool !== "text"
        ){

            return;

        }


        const pageDiv =
            event.target.closest(
                ".pdf-page"
            );


        if(!pageDiv){

            return;

        }


        const rect =
            pageDiv.getBoundingClientRect();


        selectedPage =
            pageDiv;


        selectedX =
            event.clientX -
            rect.left;


        selectedY =
            event.clientY -
            rect.top;


        textPopup.hidden =
            false;


        textInput.value =
            "";


        setTimeout(
            function(){

                textInput.focus();

            },
            100
        );

    }
);


addTextBtn.addEventListener(
    "click",
    function(){

        const text =
            textInput.value.trim();


        if(
            !text ||
            !selectedPage
        ){

            return;

        }


        const textDiv =
            document.createElement(
                "div"
            );


        textDiv.className =
            "pdf-text";


        textDiv.textContent =
            text;


        textDiv.style.left =
            selectedX + "px";


        textDiv.style.top =
            selectedY + "px";


        textDiv.style.fontSize =
            "18px";


        selectedPage.appendChild(
            textDiv
        );


        textPopup.hidden =
            true;


        activeTool =
            null;


        textBtn.classList.remove(
            "active"
        );

    }
);


cancelTextBtn.addEventListener(
    "click",
    function(){

        textPopup.hidden =
            true;

    }
);


/* =========================================================
   IMAGE TOOL
   ========================================================= */

imageInputElement.addEventListener(
    "change",
    function(){

        const file =
            this.files[0];

        if(!file){

            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            function(event){

                addImage(
                    event.target.result
                );

            };


        reader.readAsDataURL(
            file
        );


        this.value = "";

    }
);


function addImage(
    dataURL
){

    const pageDiv =
        pages[
            Math.max(
                currentPage - 1,
                0
            )
        ]?.pageDiv;


    if(!pageDiv){

        setStatus(
            "पहले PDF खोलें।"
        );

        return;

    }


    const img =
        document.createElement(
            "img"
        );


    img.src =
        dataURL;


    img.className =
        "pdf-image";


    img.style.left =
        "50px";


    img.style.top =
        "50px";


    img.style.width =
        "180px";


    img.style.height =
        "auto";


    pageDiv.appendChild(
        img
    );


    makeMovable(
        img,
        pageDiv
    );

}


/* =========================================================
   MOVE IMAGE / TEXT
   ========================================================= */

function makeMovable(
    element,
    parent
){

    let moving = false;

    let startX = 0;

    let startY = 0;

    let startLeft = 0;

    let startTop = 0;


    element.addEventListener(
        "pointerdown",
        function(event){

            event.preventDefault();

            event.stopPropagation();

            moving = true;

            element.setPointerCapture(
                event.pointerId
            );


            startX =
                event.clientX;

            startY =
                event.clientY;


            startLeft =
                parseFloat(
                    element.style.left
                ) || 0;


            startTop =
                parseFloat(
                    element.style.top
                ) || 0;

        }
    );


    element.addEventListener(
        "pointermove",
        function(event){

            if(!moving){

                return;

            }


            const dx =
                event.clientX -
                startX;


            const dy =
                event.clientY -
                startY;


            element.style.left =
                startLeft +
                dx +
                "px";


            element.style.top =
                startTop +
                dy +
                "px";

        }
    );


    element.addEventListener(
        "pointerup",
        function(){

            moving = false;

        }
    );

}


document.addEventListener(
    "click",
    function(event){

        if(
            event.target.classList.contains(
                "pdf-text"
            ) ||
            event.target.classList.contains(
                "pdf-image"
            )
        ){

            makeMovable(
                event.target,
                event.target.parentElement
            );

        }

    }
);


/* =========================================================
   ZOOM
   ========================================================= */

zoomIn.addEventListener(
    "click",
    async function(){

        if(!pdfDocument){

            return;

        }


        currentZoom += 0.25;

        if(currentZoom > 3){

            currentZoom = 3;

        }


        await rerender();

    }
);


zoomOut.addEventListener(
    "click",
    async function(){

        if(!pdfDocument){

            return;

        }


        currentZoom -= 0.25;

        if(currentZoom < 0.5){

            currentZoom = 0.5;

        }


        await rerender();

    }
);


/* =========================================================
   RE-RENDER
   ========================================================= */

async function rerender(){

    setStatus(
        "Zoom rendering..."
    );


    await renderAllPages();


    setStatus(
        "Zoom: " +
        Math.round(
            currentZoom * 100
        ) +
        "%"
    );

}


/* =========================================================
   PAGE NUMBER
   ========================================================= */

pageNumber.addEventListener(
    "change",
    function(){

        if(!pdfDocument){

            return;

        }


        let page =
            parseInt(
                this.value
            );


        if(
            isNaN(page) ||
            page < 1
        ){

            page = 1;

        }


        if(
            page >
            pdfDocument.numPages
        ){

            page =
                pdfDocument.numPages;

        }


        this.value =
            page;


        currentPage =
            page;


        const pageDiv =
            pdfContainer.querySelector(
                '[data-page="' +
                page +
                '"]'
            );


        if(pageDiv){

            pageDiv.scrollIntoView({

                behavior:
                    "smooth",

                block:
                    "start"

            });

        }

    }
);


/* =========================================================
   SCROLL → PAGE NUMBER
   ========================================================= */

viewerContainer.addEventListener(
    "scroll",
    function(){

        if(!pages.length){

            return;

        }


        let closest =
            1;

        let smallest =
            Infinity;


        pages.forEach(
            function(item){

                const rect =
                    item.pageDiv.getBoundingClientRect();


                const distance =
                    Math.abs(
                        rect.top -
                        viewerContainer
                            .getBoundingClientRect()
                            .top
                    );


                if(
                    distance <
                    smallest
                ){

                    smallest =
                        distance;

                    closest =
                        item.pageNo;

                }

            }
        );


        currentPage =
            closest;


        pageNumber.value =
            closest;

    }
);


/* =========================================================
   SEARCH
   ========================================================= */

searchBtn.addEventListener(
    "click",
    function(){

        searchBox.hidden =
            !searchBox.hidden;


        if(!searchBox.hidden){

            searchInput.focus();

        }

    }
);


searchClose.addEventListener(
    "click",
    function(){

        searchBox.hidden =
            true;

    }
);


async function searchPDF(){

    const query =
        searchInput.value
        .trim()
        .toLowerCase();


    if(
        !query ||
        !pdfDocument
    ){

        return;

    }


    for(
        let i = 1;
        i <= pdfDocument.numPages;
        i++
    ){

        const page =
            await pdfDocument.getPage(
                i
            );


        const content =
            await page.getTextContent();


        const text =
            content.items
            .map(
                item =>
                    item.str
            )
            .join(" ")
            .toLowerCase();


        if(
            text.includes(query)
        ){

            currentPage =
                i;


            pageNumber.value =
                i;


            const pageDiv =
                pdfContainer.querySelector(
                    '[data-page="' +
                    i +
                    '"]'
                );


            if(pageDiv){

                pageDiv.scrollIntoView({

                    behavior:
                        "smooth",

                    block:
                        "start"

                });

            }


            setStatus(
                "Text मिला — Page " +
                i
            );


            return;

        }

    }


    setStatus(
        "Text नहीं मिला।"
    );

}


searchNext.addEventListener(
    "click",
    searchPDF
);


searchPrev.addEventListener(
    "click",
    searchPDF
);


searchInput.addEventListener(
    "keydown",
    function(event){

        if(
            event.key === "Enter"
        ){

            searchPDF();

        }

    }
);


/* =========================================================
   CLOSE
   ========================================================= */

closeBtn.addEventListener(
    "click",
    function(){

        pdfDocument =
            null;

        originalPdfBytes =
            null;

        pdfContainer.innerHTML =
            "";

        pages =
            [];

        currentZoom =
            1;

        currentPage =
            1;

        pageNumber.value =
            1;

        pageCount.textContent =
            "/ 0";


        if(welcome){

            welcome.style.display =
                "block";

        }


        pdfInput.value =
            "";


        setStatus(
            "PDF खोलने के लिए 📂 दबाएँ"
        );

    }
);


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

document.addEventListener(
    "keydown",
    function(event){

        if(
            event.ctrlKey &&
            event.key === "+"
        ){

            event.preventDefault();

            zoomIn.click();

        }


        if(
            event.ctrlKey &&
            event.key === "-"
        ){

            event.preventDefault();

            zoomOut.click();

        }


        if(
            event.key === "Escape"
        ){

            textPopup.hidden =
                true;

            searchBox.hidden =
                true;

        }

    }
);


/* =========================================================
   INITIAL STATUS
   ========================================================= */

setStatus(
    "PDF खोलने के लिए 📂 दबाएँ"
);
