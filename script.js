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
