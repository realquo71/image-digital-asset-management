import { useState } from 'react';
import { Link } from 'react-router-dom';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const HelpPage = () => {
  const [activeSection, setActiveSection] = useState<string>('getting-started');

  const sections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Cultural Heritage DAM</h2>
          <p className="text-gray-700">
            The Cultural Heritage Digital Asset Management System helps you organize, tag, and manage digital assets for Italian cultural heritage institutions.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Quick Start Guide</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Log in with your Azure AD credentials</li>
              <li>Upload your first asset from the Assets page</li>
              <li>Add ArCo semantic tags to describe the asset</li>
              <li>Create collections to organize related assets</li>
              <li>Use advanced search to find assets quickly</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="card p-4">
              <h4 className="font-semibold text-gray-900 mb-2">For Curators</h4>
              <p className="text-sm text-gray-600 mb-3">
                Upload and manage digital assets with full metadata control.
              </p>
              <Link to="#upload" onClick={() => setActiveSection('upload')} className="text-primary-600 hover:underline text-sm">
                Learn about uploading →
              </Link>
            </div>

            <div className="card p-4">
              <h4 className="font-semibold text-gray-900 mb-2">For Researchers</h4>
              <p className="text-sm text-gray-600 mb-3">
                Search and create personal collections for your research.
              </p>
              <Link to="#search" onClick={() => setActiveSection('search')} className="text-primary-600 hover:underline text-sm">
                Learn about searching →
              </Link>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'upload',
      title: 'Uploading Assets',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Uploading Assets</h2>
          <p className="text-gray-700">
            <strong>Required Role:</strong> Curator or Admin
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step-by-Step Guide</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>
                  <strong>Navigate to Upload Page:</strong> Click "Upload" in the sidebar or go to Assets → Upload button
                </li>
                <li>
                  <strong>Select Files:</strong> Drag and drop files or click to browse. Multiple files supported.
                </li>
                <li>
                  <strong>Add Metadata:</strong> For each file, provide:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>Title (required)</li>
                    <li>Description (optional)</li>
                    <li>Status (Draft or Published)</li>
                  </ul>
                </li>
                <li>
                  <strong>Upload:</strong> Click "Upload" button and wait for processing
                </li>
              </ol>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">Supported File Types</h4>
              <ul className="text-yellow-800 space-y-1">
                <li>• Images: JPEG, PNG, GIF, TIFF</li>
                <li>• Documents: PDF</li>
                <li>• Maximum file size: 100 MB</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">EXIF Data Extraction</h3>
              <p className="text-gray-700">
                The system automatically extracts EXIF metadata from images, including:
              </p>
              <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
                <li>Image dimensions (width × height)</li>
                <li>Camera model and settings</li>
                <li>Capture date and time</li>
                <li>GPS coordinates (if available)</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'arco-tagging',
      title: 'ArCo Tagging',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">ArCo Semantic Tagging</h2>
          <p className="text-gray-700">
            ArCo (Architecture of Knowledge) is Italy's official cultural heritage ontology with 169 million RDF triples.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">8 ArCo Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: 'Cultural Property Type', example: 'scultura, dipinto, architettura' },
                  { name: 'Material', example: 'marmo, bronzo, legno' },
                  { name: 'Technique', example: 'olio su tela, affresco' },
                  { name: 'Subject', example: 'ritratto, paesaggio' },
                  { name: 'Dating', example: 'rinascimento, XVII secolo' },
                  { name: 'Current Location', example: 'Museo degli Uffizi' },
                  { name: 'Creation Place', example: 'Firenze, Roma' },
                  { name: 'Historical Period', example: 'Barocco, Rinascimento' },
                ].map((category) => (
                  <div key={category.name} className="card p-3">
                    <h4 className="font-semibold text-gray-900 text-sm">{category.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">Examples: {category.example}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Add ArCo Tags</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Open an asset detail page</li>
                <li>Scroll to "ArCo Tags" section</li>
                <li>Click "Add ArCo Tag" button</li>
                <li>Select a category from the dropdown</li>
                <li>Type at least 2 characters to search</li>
                <li>Click on a result to add the tag</li>
              </ol>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Search Tips</h4>
              <ul className="text-blue-800 space-y-1">
                <li>• Use Italian terms for best results</li>
                <li>• Results are cached for fast searching</li>
                <li>• Multiple tags per category are allowed</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'search',
      title: 'Searching Assets',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Searching Assets</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Search</h3>
              <p className="text-gray-700 mb-3">
                Use the search bar in the header to quickly find assets by title or description.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Search</h3>
              <p className="text-gray-700 mb-3">
                Access advanced search from the sidebar for powerful filtering options:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Full-text search:</strong> Search in title, description, and tags</li>
                <li><strong>Status filter:</strong> Published, Draft, or Archived</li>
                <li><strong>ArCo categories:</strong> Filter by semantic tags</li>
                <li><strong>File type:</strong> Filter by JPEG, PNG, TIFF, PDF</li>
                <li><strong>Sort options:</strong> Relevance, date, title, or file size</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Results</h3>
              <p className="text-gray-700">
                Results are ranked by relevance using Elasticsearch. Click on any asset to view details.
              </p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <h4 className="font-semibold text-green-900 mb-2">Pro Tips</h4>
              <ul className="text-green-800 space-y-1">
                <li>• Combine multiple filters for precise results</li>
                <li>• Active filters are displayed as badges</li>
                <li>• Click "Clear All Filters" to reset</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'collections',
      title: 'Collections',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Managing Collections</h2>
          <p className="text-gray-700">
            <strong>Required Role:</strong> Researcher, Curator, or Admin
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating a Collection</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Navigate to Collections page</li>
                <li>Click "New Collection" button</li>
                <li>Enter name and description</li>
                <li>Choose Public or Private visibility</li>
                <li>Click "Create Collection"</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Adding Assets to Collection</h3>
              <p className="text-gray-700 mb-2">Method 1: From Asset Detail Page</p>
              <ul className="list-disc list-inside ml-6 text-gray-700 space-y-1">
                <li>Open asset detail page</li>
                <li>Click "Add to Collection"</li>
                <li>Select collection from dropdown</li>
              </ul>
              <p className="text-gray-700 mt-3 mb-2">Method 2: From Collection Page</p>
              <ul className="list-disc list-inside ml-6 text-gray-700 space-y-1">
                <li>Open collection detail page</li>
                <li>Click "Add Assets"</li>
                <li>Browse and select assets</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Public vs Private Collections</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-4 bg-green-50">
                  <h4 className="font-semibold text-green-900 mb-2">Public Collections</h4>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• Visible to all users</li>
                    <li>• Can be discovered in search</li>
                    <li>• Good for curated exhibitions</li>
                  </ul>
                </div>
                <div className="card p-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-2">Private Collections</h4>
                  <ul className="text-gray-800 text-sm space-y-1">
                    <li>• Only visible to creator</li>
                    <li>• Personal research collections</li>
                    <li>• Can be made public later</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Download</h3>
              <p className="text-gray-700">
                Download entire collection as ZIP file by clicking "Download All" button on collection detail page.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'roles',
      title: 'User Roles',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">User Roles & Permissions</h2>

          <div className="space-y-4">
            {[
              {
                role: 'ADMIN',
                description: 'Full system access',
                color: 'red',
                permissions: [
                  'Manage users and roles',
                  'View audit logs',
                  'Access all system settings',
                  'All Curator permissions',
                ],
              },
              {
                role: 'CURATOR',
                description: 'Content management',
                color: 'blue',
                permissions: [
                  'Upload and manage assets',
                  'Add/edit metadata and tags',
                  'Create and manage collections',
                  'Publish assets',
                ],
              },
              {
                role: 'RESEARCHER',
                description: 'Research and curation',
                color: 'green',
                permissions: [
                  'View all published assets',
                  'Create personal collections',
                  'Download assets',
                  'Advanced search',
                ],
              },
              {
                role: 'VIEWER',
                description: 'Read-only access',
                color: 'gray',
                permissions: [
                  'View published assets',
                  'Basic search',
                  'View public collections',
                  'Download assets (if permitted)',
                ],
              },
            ].map((item) => (
              <div key={item.role} className={`card p-4 border-l-4 border-${item.color}-500`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.role}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${item.color}-100 text-${item.color}-800`}>
                    {item.description}
                  </span>
                </div>
                <ul className="space-y-1">
                  {item.permissions.map((permission, idx) => (
                    <li key={idx} className="text-gray-700 text-sm flex items-start">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {[
              {
                question: 'What file formats are supported?',
                answer: 'Images: JPEG, PNG, GIF, TIFF. Documents: PDF. Maximum file size is 100 MB per file.',
              },
              {
                question: 'How does ArCo tagging work?',
                answer: 'ArCo (Architecture of Knowledge) is Italy\'s official cultural heritage ontology. The system connects to the SPARQL endpoint at dati.beniculturali.it to provide standardized vocabulary for tagging cultural assets.',
              },
              {
                question: 'Can I edit assets after publishing?',
                answer: 'Curators can edit their own assets. Admins can edit any asset. Changes are logged in the audit trail.',
              },
              {
                question: 'What is the difference between tags and ArCo tags?',
                answer: 'Regular tags are free-form keywords you create. ArCo tags are standardized terms from the Italian cultural heritage ontology, providing semantic meaning and interoperability.',
              },
              {
                question: 'How do I download multiple assets?',
                answer: 'Select assets using checkboxes on the Assets page, then click "Download" button. The system will create a ZIP file containing all selected assets.',
              },
              {
                question: 'Can I share collections with external users?',
                answer: 'Public collections can be viewed by anyone with system access. For external sharing, contact your administrator about guest access configuration.',
              },
              {
                question: 'Where are my files stored?',
                answer: 'Original files are stored in SharePoint Online. The system maintains metadata in PostgreSQL database and uses Elasticsearch for fast searching.',
              },
              {
                question: 'What is EXIF data?',
                answer: 'EXIF (Exchangeable Image File Format) is metadata embedded in image files by cameras. It includes information like camera model, settings, date, and GPS coordinates.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-700 text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const activeContent = sections.find((s) => s.id === activeSection);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Help & Documentation</h1>
        <p className="text-gray-600 mt-1">
          Learn how to use the Cultural Heritage Digital Asset Management System
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-4 sticky top-6">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className={activeSection === section.id ? 'text-primary-600' : 'text-gray-400'}>
                    {section.icon}
                  </span>
                  <span className="text-sm font-medium">{section.title}</span>
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Need More Help?</h3>
              <p className="text-xs text-gray-600 mb-3">
                Contact your system administrator or IT support team.
              </p>
              <a
                href="mailto:support@culturalheritage.it"
                className="text-xs text-primary-600 hover:underline"
              >
                support@culturalheritage.it
              </a>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card p-8">
            {activeContent?.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
