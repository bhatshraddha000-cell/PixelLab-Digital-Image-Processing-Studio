import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import StatsSection from '../components/StatsSection';
import ModuleCard from '../components/ModuleCard';
import AboutSection from '../components/AboutSection';
import EnhancementIllustration from '../components/illustrations/EnhancementIllustration';
import MorphologyIllustration from '../components/illustrations/MorphologyIllustration';
import WatershedIllustration from '../components/illustrations/WatershedIllustration';
import ClassificationIllustration from '../components/illustrations/ClassificationIllustration';
import { Sparkles, Layers } from 'lucide-react';

export const Home = () => {
  const location = useLocation();

  // Scroll to hash element if provided in route (e.g., /#modules or /#about)
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  const modules = [
    {
      id: 'enhancement',
      number: '01',
      title: 'Image Enhancement',
      description: 'Improve noisy and low-quality images through Gaussian smoothing and Gamma intensity transformation.',
      tags: ['Gaussian Filter', 'Gamma Transformation', 'Histogram Analysis'],
      route: '/modules/enhancement',
      illustration: EnhancementIllustration,
      themeColor: 'cyan',
    },
    {
      id: 'morphology',
      number: '02',
      title: 'Morphological Object Separation',
      description: 'Separate lightly touching circular objects using morphological operations and automatically calculate their count.',
      tags: ['Erosion', 'Dilation', 'Connected Components'],
      route: '/modules/morphology',
      illustration: MorphologyIllustration,
      themeColor: 'teal',
    },
    {
      id: 'watershed',
      number: '03',
      title: 'Watershed Segmentation',
      description: 'Identify and separate touching or overlapping coins using marker-controlled watershed segmentation.',
      tags: ['Distance Transform', 'Markers', 'Watershed'],
      route: '/modules/watershed',
      illustration: WatershedIllustration,
      themeColor: 'violet',
    },
    {
      id: 'classification',
      number: '04',
      title: 'Geometrical Object Classification',
      description: 'Recognize and classify geometric objects using their area, perimeter, circularity, compactness and rectangularity.',
      tags: ['Area', 'Perimeter', 'Shape Descriptors'],
      route: '/modules/classification',
      illustration: ClassificationIllustration,
      themeColor: 'amber',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Project Statistics */}
      <StatsSection />

      {/* Four Module Cards Section */}
      <section id="modules" className="py-16 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Heading */}
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>CORE EXPERIMENTAL LABORATORIES</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Interactive Image Processing Modules
            </h2>

            <p className="text-base text-slate-600 dark:text-slate-300">
              Select a specialized module below to review theoretical principles, algorithmic workflows, and problem statements.
            </p>
          </div>

          {/* 2-Column Responsive Grid on Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                id={module.id}
                number={module.number}
                title={module.title}
                description={module.description}
                tags={module.tags}
                route={module.route}
                illustration={module.illustration}
                themeColor={module.themeColor}
              />
            ))}
          </div>

        </div>
      </section>

      {/* About Project Section */}
      <AboutSection />
    </div>
  );
};

export default Home;

