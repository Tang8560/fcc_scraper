import { useState, useRef, useEffect } from 'react';
import { IoSettingsOutline, IoInformationCircleOutline } from "react-icons/io5";
import axios from 'axios';
import InfoModal from './components/ModalInfo'
import SettingModal from './components/ModalSetting'

function App() {
  const [fccId, setFccId] = useState('');
  const [dateLimit, setDateLimit] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [logContent, setLogContent] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [settingOpen, setSettingOpen] = useState(false);
  const logRef = useRef(null);

  const handleSubmit = async () => {
    if (!fccId || !dateLimit) {
      alert('Please enter both FCC ID and Date');
      return;
    }

    setLoading(true);
    setStatusMessage('');
    setLogContent(''); // Reset log content on new submission

    try {
      const response = await axios.post('http://localhost:3001/scrapeFCC', {
        fccId,
        dateLimit,
      });
      setStatusMessage(response.data.message);
    } catch (error) {
      console.error(error);
      setStatusMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to listen for log messages from the backend
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/logs');
    eventSource.onmessage = (event) => {
      const logData = JSON.parse(event.data);
      setLogContent((prevContent) => `${prevContent}\n${logData.message}`);
    };

    // Cleanup when component is unmounted
    return () => {
      eventSource.close();
    };
  }, []);

  const handleInput = () => {
    const textarea = logRef.current;
    if (textarea) {
      // Reset the height to auto to shrink the height if needed
      textarea.style.height = 'auto';
      // Set the height based on the scrollHeight to adjust to content
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden">
        <header className="sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8  bg-black dark:bg-[#182235] border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between h-16 -mb-px">
              <div className="flex">
                <h3 className=" text-base font-semibold leading-7 text-white p-3">
                FCC Scraper
                </h3>
              </div>
              <div className="flex items-center space-x-3">
                {/*  Divider */}
                <hr className="w-px h-6 bg-slate-200 dark:bg-slate-700 border-none" />
                <div
                  className={`w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600/80 rounded-full ml-3 ${
                    infoOpen && 'bg-slate-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setInfoOpen(true)
                  }}
                  aria-controls="search-modal"
                >
                  <span className="sr-only">Search</span>
                  <IoInformationCircleOutline />
                </div>
                <div
                  className={`w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600/80 rounded-full ml-3 ${
                    settingOpen && 'bg-slate-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSettingOpen(true)
                  }}
                  aria-controls="search-modal"
                >
                  <span className="sr-only">Search</span>
                  <IoSettingsOutline />
                </div>
                <InfoModal modalOpen={infoOpen} setModalOpen={setInfoOpen} />
                <SettingModal modalOpen={settingOpen} setModalOpen={setSettingOpen} />
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-6 lg:px-8 py-8  bg-slate-100 dark:bg-[#383e49] border-b border-slate-200 dark:border-slate-700">
            <form className="m-0">
              <div className="space-y-5">
                <p className="text-md leading-6 text-gray-600">
                  This app connects to a specific fccId page on the site
                  <span> <a href="https://fccid.io" className="text-blue-500">https://fccid.io/</a> </span>
                  , where fccId irepresents the unique identifier for a company.
                  The app then scans the page for links containing the text “External-Photos”, “Internal-Photos”, etc.
                  Once a relevant link is found, the program searches for downloadable PDF files.
                  If PDF links are available, the app proceeds to download them.
                </p>
                <div className="flex space-x-6">
                  <div className="flex items-center">
                    <label className="text-sm font-bold text-indigo-600 mr-3 inline-block">
                      FCC ID:
                    </label>
                    <input
                      type="text"
                      value={fccId}
                      onChange={(e) => setFccId(e.target.value)}
                      placeholder="Enter FCC ID"
                      className="block rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="text-sm font-bold text-indigo-600 mr-3 inline-block">
                      Date Limit:
                    </label>
                    <input
                      type="date"
                      value={dateLimit}
                      onChange={(e) => setDateLimit(e.target.value)}
                      placeholder="Enter date"
                      className="block rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                  <div className="flex items-center">
                    <button onClick={handleSubmit} disabled={loading}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      {loading ? 'Scraping...' : 'Start Scraping'}
                    </button>
                  </div>
                </div>
                {statusMessage && <p className="text-red-500 font-semibold">{statusMessage}</p>}
              </div>
            </form>
          </div>
        </header>
        <div className="relative my-3 px-4 sm:px-6 lg:px-8 py-8 w-full h-full mx-auto overflow-y-auto">
            <textarea
              ref={logRef}
              onInput={handleInput} // Adjust height as content is added
              value={logContent}
              readOnly
              rows={20}
              className="resize-none overflow-y-auto auto h-full w-full flex-1 p-2 border-gray-300 rounded col-span-1 block border-0 py-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Console logs will appear here..."
            />
        </div>
      </div>
    </>
  );
}

export default App;