import React, { useState, useRef, useEffect } from 'react';
import { POLICY_DOCUMENT_TEXT } from './constants.js';

// The URL for the Netlify Function proxy
const NETLIFY_FUNCTION_URL = '/.netlify/functions/chat';

// --- Helper Functions ---
const extractPolicyDetails = (text) => {
    const policyNumberMatch = text.match(/Policy Number\s+GIC\s+([\d\sA-Z]+)/) || text.match(/Policy Number\s+([\d\sA-Z]+)/);
    const effectiveDatesMatch = text.match(/EFFECTIVE:\s+([\d-]+)\s+TO:\s+([\d-]+)/);
    const namedInsuredMatch = text.match(/Named Insured and Residence Premises\s+([A-Z\s]+)\s+AND\s+([A-Z\s]+)/);
    const dwellingCoverageMatch = text.match(/COVERAGE A\s+DWELLING PROTECTION\s+\$([\d,]+)/);
    const otherStructuresMatch = text.match(/COVERAGE B\s+OTHER STRUCTURES PROTECTION\s+\$([\d,]+)/);
    const personalPropertyMatch = text.match(/COVERAGE C\s+PERSONAL PROPERTY PROTECTION\s+\$([\d,]+)/);
    const windHailDeductibleMatch = text.match(/WIND AND HAIL\s+\$([\d,.]+)/);
    const otherPerilsDeductibleMatch = text.match(/ALL OTHER PERILS\s+\$([\d,.]+)/);
    const totalPremiumMatch = text.match(/TOTAL POLICY PREMIUM\s+\$([\d,.]+)/);
    const creditsMatch = text.match(/CREDITS AND DISCOUNTS.*?\$([\d,.]+\s+CR)/);
    
    const endorsementsSectionMatch = text.match(/POLICY AND ENDORSEMENTS THAT ARE PART OF YOUR CONTRACT WITH US\.([\s\S]*?)YOUR PREMIUM HAS BEEN REDUCED/);
    const endorsements = [];
    if (endorsementsSectionMatch) {
        const endorsementsText = endorsementsSectionMatch[1];
        const endorsementRegex = /^([A-Z0-9\(\)]+)\s+\(\d{2}-\d{2}\)\s+(.*)$/gm;
        let match;
        while ((match = endorsementRegex.exec(endorsementsText)) !== null) {
            endorsements.push({
                code: match[1].trim(),
                description: match[2].trim()
            });
        }
    }


    return {
        policyNumber: policyNumberMatch ? (policyNumberMatch[1] || '').replace('GIC', '').trim() : 'N/A',
        effectiveDate: effectiveDatesMatch ? `${effectiveDatesMatch[1]} to ${effectiveDatesMatch[2]}` : 'N/A',
        namedInsured: namedInsuredMatch ? `${namedInsuredMatch[1].trim()} AND ${namedInsuredMatch[2].trim()}` : 'N/A',
        dwellingCoverage: dwellingCoverageMatch ? `$${dwellingCoverageMatch[1]}` : 'N/A',
        otherStructures: otherStructuresMatch ? `$${otherStructuresMatch[1]}` : 'N/A',
        personalProperty: personalPropertyMatch ? `$${personalPropertyMatch[1]}` : 'N/A',
        windHailDeductible: windHailDeductibleMatch ? `$${windHailDeductibleMatch[1]}` : 'N/A',
        otherPerilsDeductible: otherPerilsDeductibleMatch ? `$${otherPerilsDeductibleMatch[1]}` : 'N/A',
        totalPremium: totalPremiumMatch ? `$${totalPremiumMatch[1]}` : 'N/A',
        credits: creditsMatch ? `$${creditsMatch[1]}` : 'N/A',
        endorsements,
    };
};

// --- React Components ---

const PolicySummaryCard = () => {
    const details = extractPolicyDetails(POLICY_DOCUMENT_TEXT);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Your Policy Summary</h3>
            
            <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Policy Info</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                        <p className="font-medium text-gray-600 dark:text-gray-400">Policy Number</p>
                        <p className="text-gray-800 dark:text-gray-200">{details.policyNumber}</p>
                    </div>
                    <div>
                        <p className="font-medium text-gray-600 dark:text-gray-400">Effective Dates</p>
                        <p className="text-gray-800 dark:text-gray-200">{details.effectiveDate}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="font-medium text-gray-600 dark:text-gray-400">Named Insured</p>
                        <p className="text-gray-800 dark:text-gray-200">{details.namedInsured}</p>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-600 mb-4">
                 <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Coverages</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                        <p className="font-medium text-gray-600 dark:text-gray-400">Dwelling</p>
                        <p className="text-gray-800 dark:text-gray-200">{details.dwellingCoverage}</p>
                    </div>
                    <div>
                        <p className="font-medium text-gray-600 dark:text-gray-400">Other Structures</p>
                        <p className="text-gray-800 dark:text-gray-200">{details.otherStructures}</p>
                    </div>
                     <div className="col-span-2">
                        <p className="font-medium text-gray-600 dark:text-gray-400">Personal Property</p>
                        <p className="text-gray-800 dark:text-gray-200">{details.personalProperty}</p>
                    </div>
                </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-600 mb-4">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Deductibles & Premium</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                        <p className="font-medium text-gray-600 dark:text-gray-400">Wind & Hail</p>
                        <p className="text-gray-800 dark:text-gray-200">{details.windHailDeductible}</p>
                    </div>
                    <div>
                        <p className="font-medium text-gray-600 dark:text-gray-400">All Other Perils</p>
                        <p className="text-gray-800 dark:text-gray-200">{details.otherPerilsDeductible}</p>
                    </div>
                    <div>
                        <p className="font-medium text-gray-600 dark:text-gray-400">Credits & Discounts</p>
                        <p className="text-green-600 dark:text-green-400">{details.credits}</p>
                    </div>
                     <div>
                        <p className="font-medium text-gray-600 dark:text-gray-400">Total Premium</p>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{details.totalPremium}</p>
                    </div>
                </div>
            </div>

            {details.endorsements.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Policy Endorsements</h4>
                    <ul className="space-y-2 text-sm">
                        {details.endorsements.map((endorsement, index) => (
                             <li key={index} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{endorsement.description}</p>
                                <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-1">{endorsement.code}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-600 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    For more details or to contact an agent, please{' '}
                    <a href="https://www.usaa.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                        visit the USAA website
                    </a>.
                </p>
            </div>
        </div>
    );
};


const ChatMessageComponent = ({ msg }) => {
    const isModel = msg.role === 'model';
    const isSystem = msg.role === 'system';
    
    const containerClasses = isModel ? 'justify-start' : 'justify-end';
    const bubbleClasses = isModel 
        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' 
        : isSystem
        ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
        : 'bg-blue-600 text-white';

    const content = typeof msg.content === 'string' 
        ? <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\\n/g, '<br />') }} />
        : msg.content;
        
    return (
        <div className={`flex ${containerClasses} w-full`}>
            <div className={`p-4 rounded-2xl max-w-lg md:max-w-2xl ${bubbleClasses}`}>
                 {content}
            </div>
        </div>
    );
};

const SearchModal = ({ onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const modalRef = useRef(null);

    const performSearch = () => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const paragraphs = POLICY_DOCUMENT_TEXT.split(/---/g).filter(p => p.trim() !== '');
        const matchingParagraphs = paragraphs.filter(p => 
            p.toLowerCase().includes(query.toLowerCase())
        );
        setResults(matchingParagraphs);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const highlightText = (text, highlight) => {
        if (!highlight.trim()) return text;
        const regex = new RegExp(`(${highlight})`, 'gi');
        return text.replace(regex, `<mark class="bg-yellow-300 dark:bg-yellow-500 rounded">$1</mark>`);
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl h-full max-h-[80vh] flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Search Policy</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">&times;</button>
                </div>
                <div className="p-4 flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                        placeholder="Enter search term..."
                        className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button onClick={performSearch} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Search</button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {results.length > 0 ? (
                        results.map((res, index) => (
                            <div key={index} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md text-sm text-gray-700 dark:text-gray-300"
                                 dangerouslySetInnerHTML={{ __html: highlightText(res.replace(/\n/g, '<br />'), query) }}
                            />
                        ))
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400">No results found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        setMessages([{ role: 'model', content: <PolicySummaryCard /> }]);
    }, []);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e, messageText) => {
        e.preventDefault();
        const currentInput = (messageText || userInput).trim();
        if (!currentInput || isLoading) return;

        const userMessage = { role: 'user', content: currentInput };
        
        const history = messages
            .filter(msg => typeof msg.content === 'string')
            .map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));
            
        setMessages((prev) => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await fetch(NETLIFY_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: currentInput,
                    history: history 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }

            const data = await response.json();
            const modelResponse = data?.text;
            
            if (typeof modelResponse !== 'string') {
                 throw new Error("Received an invalid response format from the server.");
            }

            setMessages((prev) => [...prev, { role: 'model', content: modelResponse }]);

        } catch (err) {
            const errorContent = err instanceof Error ? err.message : 'An unknown error occurred.';
            setMessages((prev) => [...prev, { role: 'system', content: `Error: ${errorContent}` }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleMicClick = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            return;
        }

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results).map(result => result[0].transcript).join('');
            setUserInput(transcript);
        };
        recognition.onend = () => {
            setIsRecording(false);
        };
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
        };
        
        recognition.start();
        setIsRecording(true);
    };


    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 font-sans">
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">Insurance Policy Assistant</h1>
                </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setShowSearchModal(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Search document">
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                    <a href="https://www.usaa.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200">
                        Contact USAA
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((msg, index) => <ChatMessageComponent key={index} msg={msg} />)}
                    {isLoading && messages.length > 0 && messages[messages.length-1].role !== 'model' && (
                       <div className="flex justify-start w-full">
                           <div className="p-4 rounded-2xl max-w-lg md:max-w-2xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
                               <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                               </div>
                           </div>
                       </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Ask about your policy..."
                            className="w-full pl-4 pr-12 py-3 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading || isRecording}
                            aria-label="Chat input"
                        />
                        <button type="button" onClick={handleMicClick} className={`absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 dark:text-gray-400 hover:text-blue-600 ${isRecording ? 'text-red-500' : ''}`} disabled={isLoading}>
                             <svg className={`w-6 h-6 ${isRecording ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zM17 11h-1c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92z"/></svg>
                        </button>
                    </div>
                    <button type="submit" disabled={isLoading || !userInput.trim()} className="p-3 bg-blue-600 text-white rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" aria-label="Send message">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                </form>
            </footer>
             {showSearchModal && <SearchModal onClose={() => setShowSearchModal(false)} />}
        </div>
    );
};

export default App;