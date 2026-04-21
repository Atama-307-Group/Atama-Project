import { useRef, useState } from "react";
import { extractText } from "unpdf";

const VALID_SUBJECTS = new Set([
  "AAE","AAS","ABE","AD","AFT","AGEC","AGR","AGRY","AIS","AMST","ANSC","ANTH",
  "ARAB","ARCH","ASAM","ASEC","ASL","ASM","ASTR","AT","BAND","BCHM","BIOL",
  "BME","BMS","BTNY","CDIS","CE","CEM","CEMT","CGT","CHE","CHM","CHNS","CIMT",
  "CIT","CLCS","CLPH","CM","CMPL","CNIT","COM","CPB","CS","CSCI","CSR","DANC",
  "DCTC","EAPS","ECE","ECET","ECON","EDCI","EDPS","EDST","EEE","ENE","ENGL",
  "ENGR","ENGT","ENTM","ENTR","EPCS","EXPL","FLM","FMGT","FNR","FR","FS",
  "FVS","GEP","GER","GRAD","GREK","GS","GSLA","HDFS","HEBR","HEMT","HER",
  "HHS","HIST","HK","HONR","HORT","HSCI","HSRV","HTM","IDE","IDIS","IE","IET",
  "ILS","IMPH","INFO","INT","IPPH","IT","ITAL","JPNS","JWST","KOR","LA","LALS",
  "LATN","LC","LIBR","LING","LS","MA","MARS","MATH","MCMP","ME","MET","MFET",
  "MGMT","MSE","MSL","MSPE","MUS","NEWM","NRES","NS","NUCL","NUPH","NUR","NUTR",
  "OBHR","OLS","PES","PHAD","PHIL","PHPR","PHRM","PHSC","PHYS","POL","PSY",
  "PTEC","PTGS","PUBH","QSCI","RECR","REL","RUSS","SA","SCI","SCLA","SFS",
  "SLHS","SOC","SPAN","STAT","SYS","TCEM","TCM","TDM","TECH","THTR","TLI",
  "VCS","VIP","VM","WGSS"
]);

const COURSE_PATTERN = /\b([A-Z]{2,8})\s+(\d{3,6}[A-Z]*)\b/g;

function extractCoursesFromText(text) {
    const matches = new Set();
    let match;
    while ((match = COURSE_PATTERN.exec(text)) !== null) {
        const subject = match[1].toUpperCase();
        if (VALID_SUBJECTS.has(subject)) {
            matches.add(`${subject} ${match[2]}`);
        }
    }
    COURSE_PATTERN.lastIndex = 0;
    return [...matches];
}

const EnrollFromScheduleModal = ({ onClose, onEnroll, courses = [] }) => {
    const [scheduleText, setScheduleText] = useState("");
    const [parsedCourses, setParsedCourses] = useState(null); // null = input step, array = confirm step
    const [pdfError, setPdfError] = useState(null);
    const [parsing, setParsing] = useState(false);
    const scheduleFileRef = useRef(null);

    function matchAgainstSystem(rawCodes) {
        const found = [];
        const notFound = [];

        for (const code of rawCodes) {
            const match = courses.find(c =>
                c.courseCode.trim().toUpperCase() === code.trim().toUpperCase()
            );
            if (match) found.push(match);
            else notFound.push(code);
        }

        return { found, notFound };
    }

    async function handleFile(file) {
        if (!file || file.type !== "application/pdf") {
                setPdfError("Please upload a valid PDF file.");
                return;
            }
        setPdfError(null);
        setParsing(true);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const { text } = await extractText(new Uint8Array(arrayBuffer));

            console.log(text);
            console.log("Extracted codes:", extractCoursesFromText(text));

            const rawCodes = extractCoursesFromText(text);
            setParsedCourses(matchAgainstSystem(rawCodes));
        } catch (err) {
            setPdfError("Failed to parse PDF. Try typing your courses manually.");
            console.error(err);
        } finally {
            setParsing(false);
        }
    }

    function handleTextSubmit() {
        const lines = scheduleText
            .split("\n")
            .map(l => l.trim().toUpperCase())
            .filter(Boolean);
        setParsedCourses(matchAgainstSystem(lines));
    }

    function handleConfirm() {
        onEnroll(parsedCourses.found);
    }

    // Confirming parsed courses
    if (parsedCourses !== null) {
        return (
            <div className="modalOverlay" onClick={onClose}>
                <div className="modal scheduleModal" onClick={e => e.stopPropagation()}>
                    <div className="scheduleModalHeader">
                        <div>
                            <div className="modalTitle">Confirm enrollment</div>
                            <p className="scheduleModalSubtitle">
                                Review the courses found before enrolling.
                            </p>
                        </div>
                        <button className="scheduleCloseBtn" onClick={onClose}>✕</button>
                    </div>

                    {parsedCourses.found.length > 0 && (
                        <div className="scheduleConfirmSection">
                            <p className="scheduleConfirmLabel scheduleConfirmLabel--found">
                                ✓ Will be enrolled ({parsedCourses.found.length})
                            </p>
                            <ul className="scheduleConfirmList">
                                {parsedCourses.found.map(c => (
                                    <li key={c.id} className="scheduleConfirmItem scheduleConfirmItem--found">
                                        <span className="scheduleConfirmCode">{c.courseCode}</span>
                                        <span className="scheduleConfirmName">{c.courseName}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {parsedCourses.notFound.length > 0 && (
                        <div className="scheduleConfirmSection">
                            <p className="scheduleConfirmLabel scheduleConfirmLabel--missing">
                                ✕ Not found in system ({parsedCourses.notFound.length})
                            </p>
                            <ul className="scheduleConfirmList">
                                {parsedCourses.notFound.map(code => (
                                    <li key={code} className="scheduleConfirmItem scheduleConfirmItem--missing">
                                        <span className="scheduleConfirmCode">{code}</span>
                                        <span className="scheduleConfirmName">Not available</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {parsedCourses.found.length === 0 && parsedCourses.notFound.length === 0 && (
                        <p className="scheduleEmpty">No course codes were detected. Try again or type them manually.</p>
                    )}

                    <div className="modalActions">
                        <button className="btn cancelBtn" onClick={() => setParsedCourses(null)}>
                            ← Back
                        </button>
                        <button
                            className="btn primary"
                            onClick={handleConfirm}
                            disabled={parsedCourses.found.length === 0}
                        >
                            {parsedCourses.found.length === 0
                                ? "Nothing to enroll"
                                : `Enroll in ${parsedCourses.found.length} course${parsedCourses.found.length !== 1 ? "s" : ""}`}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Inputting schedule
    return (
        <div className="modalOverlay" onClick={onClose}>
            <div className="modal scheduleModal" onClick={e => e.stopPropagation()}>
                <div className="scheduleModalHeader">
                    <div>
                        <div className="modalTitle">Enroll from schedule</div>
                        <p className="scheduleModalSubtitle">
                            Upload a PDF from your scheduling website, or type course codes directly, one per line.
                        </p>
                    </div>
                    <button className="scheduleCloseBtn" onClick={onClose}>✕</button>
                </div>

                <div
                    className={`scheduleDropZone ${parsing ? "scheduleDropZone--loading" : ""}`}
                    onClick={() => !parsing && scheduleFileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                >
                    {parsing ? (
                        <p className="scheduleDropMain">Parsing PDF…</p>
                    ) : (
                        <>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#77BFA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <p className="scheduleDropMain">Drop a PDF here, or click to browse</p>
                            <p className="scheduleDropSub">Currently only supports Unitime</p>
                        </>
                    )}
                    <input
                        ref={scheduleFileRef}
                        type="file"
                        accept="application/pdf"
                        style={{ display: "none" }}
                        onChange={e => handleFile(e.target.files[0])}
                    />
                </div>

                {pdfError && <p className="scheduleError">{pdfError}</p>}

                <div className="scheduleDivider"><span>or type the course codes manually</span></div>

                <div>
                    <textarea
                        className="scheduleTextarea"
                        rows={5}
                        placeholder={"CS 30700\nBAND 11100S\nPHIL 30200\nNo abbreviations!"}
                        value={scheduleText}
                        onChange={e => setScheduleText(e.target.value)}
                    />
                    <p className="scheduleTextareaHint">Enter one course code per line (e.g. CS 30700)</p>
                </div>

                <div className="modalActions">
                    <button className="btn cancelBtn" onClick={onClose}>Cancel</button>
                    <button
                        className="btn primary"
                        onClick={handleTextSubmit}
                        disabled={!scheduleText.trim()}
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnrollFromScheduleModal;