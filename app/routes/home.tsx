import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  useEffect(() => {
    if(!auth.isAuthenticated) navigate('/auth?next=/');
  }, [auth.isAuthenticated])

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);

      try {
        const resumes = (await kv.list('resume:*', true)) as KVItem[];

        if (!resumes || resumes.length === 0) {
          setResumes([]);
          setLoadingResumes(false);
          return;
        }

        const parsedResumes = resumes?.map((resume) => {
          try {
            const parsed = JSON.parse(resume.value) as Resume;
            return parsed;
          } catch (error) {
            console.error('Error parsing resume:', error);
            return null;
          }
        }).filter(Boolean) as Resume[];

        setResumes(parsedResumes || []);
      } catch (error) {
        console.error('Error loading resumes:', error);
        setResumes([]);
      } finally {
        setLoadingResumes(false);
      }
    }

    if (auth.isAuthenticated) {
      loadResumes();
    }
  }, [auth.isAuthenticated]);

  // Refresh resumes when returning to home page
  useEffect(() => {
    const handleFocus = () => {
      if (auth.isAuthenticated) {
        const loadResumes = async () => {
          try {
            const resumes = (await kv.list('resume:*', true)) as KVItem[];
            if (resumes && resumes.length > 0) {
              const parsedResumes = resumes?.map((resume) => {
                try {
                  return JSON.parse(resume.value) as Resume;
                } catch (error) {
                  return null;
                }
              }).filter(Boolean) as Resume[];
              setResumes(parsedResumes || []);
            }
          } catch (error) {
            console.error('Error refreshing resumes:', error);
          }
        };
        loadResumes();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [auth.isAuthenticated]);

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />

    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Track Your Applications & Resume Ratings</h1>
        {!loadingResumes && resumes?.length === 0 ? (
            <h2>No resumes found. Upload your first resume to get feedback.</h2>
        ): (
          <h2>Review your submissions and check AI-powered feedback.</h2>
        )}
      </div>
      {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
      )}

      {!loadingResumes && resumes.length > 0 && (
        <div className="resumes-section">
          {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      )}

      {!loadingResumes && resumes?.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              Upload Resume
            </Link>
          </div>
      )}
    </section>
  </main>
}