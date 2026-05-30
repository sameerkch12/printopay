import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const title = 'PrintoPay - Scan Shop QR, Upload Print Files, Get Print Code';
const description =
  'PrintoPay helps customers search PrintoPay on Google, scan a print shop QR, upload PDF or image files, choose print settings, and get a secure print code instantly.';
const siteUrl = 'https://www.printopay.com/';
const brandName = 'PrintoPay';
const keywords = [
  'PrintoPay',
  'PrintoPay print',
  'PrintoPay QR scan',
  'scan shop QR',
  'upload print file online',
  'upload PDF for print',
  'print code',
  'nearby print shop upload',
  'online print upload India',
  'WhatsApp print alternative',
  'Google par PrintoPay search karein',
  'shop QR scan karein',
  'file upload karein',
  'print code batayein',
].join(', ');
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}#organization`,
      name: brandName,
      url: siteUrl,
      logo: `${siteUrl}assets/images/logo.png`,
      description,
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      name: brandName,
      url: siteUrl,
      publisher: { '@id': `${siteUrl}#organization` },
      inLanguage: ['en-IN', 'hi-IN'],
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}#webapp`,
      name: brandName,
      url: siteUrl,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS',
      browserRequirements: 'Requires a modern web browser with camera and file upload support.',
      description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${siteUrl}#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I upload a file for printing with PrintoPay?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Search PrintoPay on Google, open the website, scan the print shop QR code, upload your file, choose print settings, and show the print code at the shop counter.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do customers need to install an app?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Customers can use PrintoPay from a web browser to scan a shop QR, upload files, and get a print code.',
          },
        },
        {
          '@type': 'Question',
          name: 'What can customers print through PrintoPay?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Customers can upload PDF and supported image files, select copies, color or black-and-white printing, page range, and orientation before sending the job to the selected print shop.',
          },
        },
      ],
    },
  ],
};

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en-IN">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <link rel="canonical" href={siteUrl} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="application-name" content={brandName} />
        <meta name="apple-mobile-web-app-title" content={brandName} />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={brandName} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={`${siteUrl}assets/images/logo.png`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${siteUrl}assets/images/logo.png`} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <ScrollViewStyleReset />
      </head>
      <body>
        <noscript>
          <main>
            <h1>PrintoPay - Scan Shop QR and Upload Print Files</h1>
            <p>
              PrintoPay helps customers send print files to nearby print shops without WhatsApp confusion.
              Google par PrintoPay search karein, shop QR scan karein, file upload karein, print settings
              choose karein, aur secure print code shop counter par batayein.
            </p>
            <h2>How PrintoPay Works</h2>
            <ol>
              <li>Google par PrintoPay search karein ya www.printopay.com open karein.</li>
              <li>Print shop ka QR code scan karein.</li>
              <li>PDF ya image file upload karein.</li>
              <li>Copies, color or black-and-white, page range, and orientation select karein.</li>
              <li>Print code shop owner ko batayein aur print collect karein.</li>
            </ol>
            <p>
              PrintoPay is useful for college students, coaching students, cyber cafes, photocopy shops,
              print shops, assignments, notes, forms, admit cards, ID documents, and fast local printing.
            </p>
          </main>
        </noscript>
        {children}
      </body>
    </html>
  );
}
