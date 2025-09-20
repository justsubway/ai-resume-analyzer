import {type FormEvent, useState, useEffect} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { LinkedInImport } from "~/components/LinkedInImport";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        companyName: '',
        jobTitle: '',
        jobDescription: ''
    });
    const [error, setError] = useState('');

    // Redirect to auth page if not authenticated (but not during processing)
    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated && !isProcessing) {
            navigate('/auth');
        }
    }, [auth.isAuthenticated, isLoading, navigate, isProcessing]);

    // Debug: Log when formData changes
    useEffect(() => {
        console.log('Form data changed:', formData);
    }, [formData]);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleLinkedInDataExtracted = (data: { companyName: string; jobTitle: string; jobDescription: string }) => {
        console.log('handleLinkedInDataExtracted called with:', data);
        console.log('Current formData before update:', formData);
        setFormData(data);
        setError('');
        console.log('Form data updated to:', data);
        
        // Force a re-render to see if the form updates
        setTimeout(() => {
            console.log('Form data after timeout:', formData);
        }, 100);
    }

    const handleLinkedInError = (errorMessage: string) => {
        setError(errorMessage);
    }

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File  }) => {
        setIsProcessing(true);

        setStatusText('Uploading the file...');
        const uploadedFile = await fs.upload([file]);
        if(!uploadedFile) return setStatusText('Error: Failed to upload file');

        setStatusText('Converting to image...');
        const imageFile = await convertPdfToImage(file);
        if(!imageFile.file) return setStatusText('Error: Failed to convert PDF to image');

        setStatusText('Uploading the image...');
        const uploadedImage = await fs.upload([imageFile.file]);
        if(!uploadedImage) return setStatusText('Error: Failed to upload image');

        setStatusText('Preparing data...');
        const uuid = generateUUID();
        const data = {
            id: uuid,
            resumePath: uploadedFile.path,
            imagePath: uploadedImage.path,
            companyName, jobTitle, jobDescription,
            feedback: '',
        }
        await kv.set(`resume:${uuid}`, JSON.stringify(data));

        setStatusText('Analyzing...');

        try {
            // Refresh auth status before analysis to prevent auth loss
            await auth.checkAuthStatus();
            
            if (!auth.isAuthenticated) {
                setStatusText('Authentication lost, please sign in again');
                setError('Your session expired. Please sign in again.');
                return;
            }

            // Add timeout to prevent hanging
            const feedbackPromise = ai.feedback(
                uploadedFile.path,
                prepareInstructions({ jobTitle, jobDescription })
            );
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Analysis timeout - please try again')), 60000) // 60 second timeout
            );
            
            const feedback = await Promise.race([feedbackPromise, timeoutPromise]);
            
            if (!feedback) {
                setStatusText('Error: Failed to analyze resume');
                setError('AI analysis failed. Please try again.');
                return;
            }

            console.log('Raw feedback response:', feedback);

            let feedbackText;
            
            // Handle different response formats
            if (feedback && typeof feedback === 'object') {
                if ('message' in feedback) {
                    const message = (feedback as any).message;
                    if (typeof message.content === 'string') {
                        feedbackText = message.content;
                    } else if (Array.isArray(message.content) && message.content.length > 0) {
                        feedbackText = message.content[0].text || message.content[0];
                    } else {
                        setStatusText('Error: Invalid feedback format');
                        setError('AI returned invalid response format. Please try again.');
                        return;
                    }
                } else if ('content' in feedback) {
                    // Direct content response
                    if (typeof feedback.content === 'string') {
                        feedbackText = feedback.content;
                    } else if (Array.isArray(feedback.content) && feedback.content.length > 0) {
                        feedbackText = feedback.content[0].text || feedback.content[0];
                    } else {
                        setStatusText('Error: Invalid feedback format');
                        setError('AI returned invalid response format. Please try again.');
                        return;
                    }
                } else {
                    // Try to extract text from any other format
                    feedbackText = JSON.stringify(feedback);
                }
            } else {
                setStatusText('Error: Invalid feedback format');
                setError('AI returned invalid response format. Please try again.');
                return;
            }

            console.log('Feedback text to parse:', feedbackText);

            try {
                data.feedback = JSON.parse(feedbackText);
            } catch (parseError) {
                console.error('Error parsing feedback JSON:', parseError);
                console.error('Raw feedback text:', feedbackText);
                
                // Try to extract JSON from the response if it's wrapped in text
                const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        data.feedback = JSON.parse(jsonMatch[0]);
                        console.log('Successfully extracted JSON from response');
                    } catch (secondParseError) {
                        console.error('Failed to parse extracted JSON:', secondParseError);
                        setStatusText('Error: Invalid feedback format');
                        setError('Failed to parse AI response. Please try again.');
                        return;
                    }
                } else {
                    setStatusText('Error: Invalid feedback format');
                    setError('Failed to parse AI response. Please try again.');
                    return;
                }
            }

            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            setStatusText('Analysis complete, redirecting...');
            console.log('Final resume data:', data);
            
            // Refresh the home page data by triggering a reload
            setTimeout(() => {
                navigate(`/resume/${uuid}`);
            }, 1000);
        } catch (error) {
            console.error('Error during AI analysis:', error);
            setStatusText('Error: Analysis failed');
            setError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if(!file) {
            setError('Please upload a resume file');
            return;
        }

        if(!formData.companyName.trim() || !formData.jobTitle.trim() || !formData.jobDescription.trim()) {
            setError('Please fill in all required fields or use LinkedIn import');
            return;
        }

        handleAnalyze({ 
            companyName: formData.companyName, 
            jobTitle: formData.jobTitle, 
            jobDescription: formData.jobDescription, 
            file 
        });
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full" />
                        </>
                    ) : (
                        <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && (
                        <div className="flex flex-col gap-6 mt-8">
                            {/* LinkedIn Import Section */}
                            <LinkedInImport 
                                onDataExtracted={handleLinkedInDataExtracted}
                                onError={handleLinkedInError}
                            />

                            {/* Error Display */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                                    {error}
                                </div>
                            )}

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Or enter manually</span>
                                </div>
                            </div>

                            {/* Manual Form */}
                            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="form-div">
                                    <label htmlFor="company-name">Company Name</label>
                                    <input 
                                        type="text" 
                                        name="company-name" 
                                        placeholder="Company Name" 
                                        id="company-name"
                                        value={formData.companyName}
                                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                                        style={{ border: formData.companyName ? '2px solid green' : '1px solid #ccc' }}
                                    />
                                </div>
                                <div className="form-div">
                                    <label htmlFor="job-title">Job Title</label>
                                    <input 
                                        type="text" 
                                        name="job-title" 
                                        placeholder="Job Title" 
                                        id="job-title"
                                        value={formData.jobTitle}
                                        onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                                        style={{ border: formData.jobTitle ? '2px solid green' : '1px solid #ccc' }}
                                    />
                                </div>
                                <div className="form-div">
                                    <label htmlFor="job-description">Job Description</label>
                                    <textarea 
                                        rows={5} 
                                        name="job-description" 
                                        placeholder="Job Description" 
                                        id="job-description"
                                        value={formData.jobDescription}
                                        onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                                        style={{ border: formData.jobDescription ? '2px solid green' : '1px solid #ccc' }}
                                    />
                                </div>

                                <div className="form-div">
                                    <label htmlFor="uploader">Upload Resume</label>
                                    <FileUploader onFileSelect={handleFileSelect} />
                                </div>

                                <button className="primary-button" type="submit">
                                    Analyze Resume
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload
