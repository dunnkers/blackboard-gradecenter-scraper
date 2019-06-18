(function(a,b){if("function"==typeof define&&define.amd)define([],b);else if("undefined"!=typeof exports)b();else{b(),a.FileSaver={exports:{}}.exports}})(this,function(){"use strict";function b(a,b){return"undefined"==typeof b?b={autoBom:!1}:"object"!=typeof b&&(console.warn("Deprecated: Expected third argument to be a object"),b={autoBom:!b}),b.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(a.type)?new Blob(["\uFEFF",a],{type:a.type}):a}function c(b,c,d){var e=new XMLHttpRequest;e.open("GET",b),e.responseType="blob",e.onload=function(){a(e.response,c,d)},e.onerror=function(){console.error("could not download file")},e.send()}function d(a){var b=new XMLHttpRequest;b.open("HEAD",a,!1);try{b.send()}catch(a){}return 200<=b.status&&299>=b.status}function e(a){try{a.dispatchEvent(new MouseEvent("click"))}catch(c){var b=document.createEvent("MouseEvents");b.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),a.dispatchEvent(b)}}var f="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof global&&global.global===global?global:void 0,a=f.saveAs||("object"!=typeof window||window!==f?function(){}:"download"in HTMLAnchorElement.prototype?function(b,g,h){var i=f.URL||f.webkitURL,j=document.createElement("a");g=g||b.name||"download",j.download=g,j.rel="noopener","string"==typeof b?(j.href=b,j.origin===location.origin?e(j):d(j.href)?c(b,g,h):e(j,j.target="_blank")):(j.href=i.createObjectURL(b),setTimeout(function(){i.revokeObjectURL(j.href)},4E4),setTimeout(function(){e(j)},0))}:"msSaveOrOpenBlob"in navigator?function(f,g,h){if(g=g||f.name||"download","string"!=typeof f)navigator.msSaveOrOpenBlob(b(f,h),g);else if(d(f))c(f,g,h);else{var i=document.createElement("a");i.href=f,i.target="_blank",setTimeout(function(){e(i)})}}:function(a,b,d,e){if(e=e||open("","_blank"),e&&(e.document.title=e.document.body.innerText="downloading..."),"string"==typeof a)return c(a,b,d);var g="application/octet-stream"===a.type,h=/constructor/i.test(f.HTMLElement)||f.safari,i=/CriOS\/[\d]+/.test(navigator.userAgent);if((i||g&&h)&&"object"==typeof FileReader){var j=new FileReader;j.onloadend=function(){var a=j.result;a=i?a:a.replace(/^data:[^;]*;/,"data:attachment/file;"),e?e.location.href=a:location=a,e=null},j.readAsDataURL(a)}else{var k=f.URL||f.webkitURL,l=k.createObjectURL(a);e?e.location=l:location.href=l,e=null,setTimeout(function(){k.revokeObjectURL(l)},4E4)}});f.saveAs=a.saveAs=a,"undefined"!=typeof module&&(module.exports=a)});

function scrapeAttempt(row, nr) {
    const anchor = row.down('a.gradeAttempt');

    const item = row.querySelector('td:nth-child(2) .table-data-cell-value').textContent.trim();
    const attemptId = anchor.getAttribute('attemptId');
    const studentName = anchor.text.trim();
    const date = new Date(row.querySelector('td:nth-child(4) .table-data-cell-value').textContent);

    const courseId = new URL(window.location.href).searchParams.get('course_id');
    const url = '/webapps/gradebook/do/instructor/performGrading' +
                '?course_id=' + courseId +
                '&source=cp_gradebook_needs_grading' +
                '&cancelGradeUrl=%2Fwebapps%2Fgradebook%2Fdo%2Finstructor%2FviewNeedsGrading%3Fcourse_id%3D' + courseId +
                '&mode=invokeFromNeedsGrading' +
                '&viewInfo=Needs+Grading' +
                '&attemptId='+ attemptId

    // `attempt` object
    return {
        item,
        attemptId,
        studentName,
        date,
        url,
        nr
    };
}

function scrapeAttempts() {
    const attemptrows = $('listContainer_databody').rows;
    let rows = Array.from(attemptrows);
    return rows.map(scrapeAttempt);
}

function parsePage(html) {
    const parser = new DOMParser();
    return parser.parseFromString(html, "text/html");
}

function getPageDoc(url) {
    return fetch(url)
        .then(res => res.text())
        .then(html => parsePage(html));
}

function parseQuestion(questionDoc) {
    let title = questionDoc.querySelector('.steptitle').textContent;
    let title_parsed = /.*Question.(\d+):(.*)/.exec(title);
    let nr = Number(title_parsed[1]);
    let type = title_parsed[2].trim().toLowerCase();
    let question = { nr, type, downloadable: false };

    switch (type) {
        case 'file response':
            question.file = getFile(questionDoc);
            question.downloadable = true;
            break;
        case 'essay':
            question.essay = getEssay(questionDoc);
            question.downloadable = true;
            break;
        case 'fill in multiple blanks':
            break;
        default:
            break;
    }

    return question;
}

function getQuestions(doc) {
    let container = doc.querySelector('#dataCollectionContainer');
    let questions = container.childElements()
        .filter(elem => elem.getAttribute('id') && elem.tagName === 'DIV' && !elem.id.includes('step'));    
    return questions.map(parseQuestion);
}

function getEssay(doc) {
    let answer = doc.querySelector('table').rows[2].querySelector('.vtbegenerated');
    return answer ? answer.textContent : null;
}

function getFile(doc) {
    let file = doc.querySelector('a[href*="uploaded_filename"]');

    // file object
    return file ? {
        href: file.href,
        name: file.text,
        uploaded_filename: new URL(file.href).searchParams.get('uploaded_filename')
    } : null;
}

function promiseAttempt(attempt) {
    return getPageDoc(attempt.url).then(doc => {
        let questions = getQuestions(doc);

        // attach questions to attempt.
        return {
            ...attempt,
            questions
        };
    });
};

function getFilename(attempt, question) {
   let studentname = attempt.studentName.replace(/ /g, '-').toLowerCase();
   return `${attempt.nr}-Q${question.nr}_${attempt.item}_${studentname}`;
}

function downloadQuestion(attempt, question) {
    let filename = getFilename(attempt, question);
    if (!filename) return Promise.resolve();

    let globOrHref;
    switch (question.type) {
        case 'file response':
            if (!question.file) break;

            // file renaming
            let re = /(?:\.([^.]+))?$/;
            let ext_actual = re.exec(question.file.name)[1];
            if (!ext_actual) {
                // should manually rename this file download, cause no extension:
                // browser doesn't properly rename files without extension.
                console.log(`mv "${question.file.uploaded_filename}" "${filename}"`);
            } else {
                // append extension.
                filename = `${filename}.${ext_actual}`;
            }

            globOrHref = question.file.href;
            break;
        case 'essay':
            if (!question.essay) break;

            globOrHref = new Blob([ question.essay ], {
                type: "text/plain;charset=utf-8"
            });
            break;
    }

    return globOrHref ? new Promise(resolve => {
        saveAs(globOrHref, filename);
        setTimeout(() => resolve(), 250);
    }) : Promise.resolve();
}

function mapAttempt(attempt) {
    return new Promise(resolve => {
        let downloads = attempt.questions.filter(q => q.downloadable);
        
        downloads.reduce(
          (p, question, i) =>
            p.then(_ => 
                downloadQuestion(attempt, question)
            ).then(_ => {
                if (i === (downloads.length - 1)) { // last item. resolve.
                    resolve(attempt);
                }
            }),
          Promise.resolve()
        );
    });
}

// Sequentially execute.
var scrapedAttempts = scrapeAttempts();
console.log(`Analyzing ${scrapedAttempts.length} attempts...`);
var lastitem = scrapedAttempts.reduce(
  (p, attempt) =>
    p.then(_ =>
        promiseAttempt(attempt)
    ).then(mapAttempt).then(attempt => {
        console.log(`Analyzed attempt nr ${attempt.nr}`);
        return attempt;
    }).then(_ => {
        if (i === (scrapedAttempts.length - 1)) { // last item.
            console.log(`Analyzed ${scrapedAttempts.length} attempts!`);
        }
    }),
  Promise.resolve()
);

