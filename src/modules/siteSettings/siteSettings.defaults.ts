/**
 * Every piece of website copy the staff portal can edit, with the text the
 * site launched with. The stored document only holds what was changed; reads
 * merge it over these defaults (siteSettings.service.ts), so adding a field
 * here makes it appear on the website and in the portal straight away.
 *
 * In titles, a line break ("\n") becomes a <br> on the website.
 */
export const DEFAULT_SITE_CONTENT = {
  general: {
    brandName: 'G.D.',
    brandTagline: 'Pharmaceuticals Limited',
    footerText:
      'Generic allopathic medicines made in Nepal.\nCorporate claims and product details remain subject to company approval.',
    /** Footer. */
    address: 'Tripureshwor, Kathmandu',
    /** Contact page "Head office". */
    officeAddress: 'Tripureshwor, Kathmandu, Nepal',
    phone: '',
    email: '',
    /** Shown in place of the phone and email while both are blank. */
    contactPendingText: 'Phone and email — to be confirmed',
    copyright: '© 2026 G.D. Pharmaceuticals Limited',
    /** New website enquiries are emailed here; blank sends nothing. */
    notificationEmail: '',
  },

  /** Photos; blank uses the photo the website ships with. */
  images: {
    hero: '',
    lab: '',
    quality: '',
    about: '',
    careers: '',
    news: '',
  },

  home: {
    heroEyebrow: 'Made in Nepal · For healthier communities',
    heroTitle: 'Medicines made in\nNepal.',
    heroLead:
      'G.D. Pharmaceuticals Limited is a Nepali manufacturer of generic allopathic medicines, committed to responsible care and trusted quality.',
    proof: [
      { title: 'Nepal', text: 'Locally rooted' },
      { title: 'Generic', text: 'Allopathic medicines' },
      { title: 'Quality', text: 'At every stage' },
    ],
    floatLabel: 'Our purpose',
    floatTitle: 'Science with care',
    ticker: [
      'Made in Nepal',
      'Generic allopathic medicines',
      'Associated with G.D. Group',
      'Quality at every stage',
      'Head office in Tripureshwor, Kathmandu',
    ],
    aboutEyebrow: 'Who we are',
    aboutTitle: 'Rooted here. Focused on\nbetter health.',
    aboutParagraphs: [
      'Associated with G.D. Group, we are building a modern pharmaceutical story from Nepal—one grounded in care, consistency and scientific responsibility.',
      'Our company profile, leadership details and operating milestones will be published as they are approved.',
    ],
    photoNote: 'Quality is a process, not a promise.',
    productsEyebrow: 'Our products',
    productsTitle: 'Everyday medicines,\nmade with purpose.',
    investorsEyebrow: 'Investor centre',
    investorsTitle: 'Clear information.\nResponsible updates.',
    investorsLead: 'Find corporate notices, reports and verified updates in one place.',
    /** Yellow pill under the notice; blank hides it. */
    ipoStatus: 'IPO status awaiting official company update',
    ctaEyebrow: 'Start a conversation',
    ctaTitle: 'How can we help?',
    ctaLead: 'For product, distributor, investor or general enquiries, our team is ready to direct your message.',
  },

  about: {
    head: {
      eyebrow: 'Company',
      title: 'A Nepali company with a clear purpose.',
      lead: 'Our story is shaped by local roots, scientific responsibility and a long-term commitment to better health.',
    },
    storyEyebrow: 'Our story',
    storyTitle: 'From Nepal, for the future of health.',
    storyParagraphs: [
      'G.D. Pharmaceuticals Limited is a Nepali manufacturer of generic allopathic medicines and is associated with G.D. Group.',
      'This profile is prepared for company review. Final legal wording, founding information and leadership details remain editable until approved.',
    ],
    /** Yellow pill under the story; blank hides it. */
    pendingNote: 'Founding year and leadership details to be confirmed',
    photoTag: 'Approved company imagery to be supplied',
    valuesEyebrow: 'What guides us',
    valuesTitle: 'A foundation of care and responsibility.',
    values: [
      { title: 'Purpose', text: 'Support healthier communities through accessible medicines.' },
      { title: 'Integrity', text: 'Communicate clearly and act with accountability.' },
      { title: 'Quality', text: 'Build consistency into each approved process.' },
      { title: 'Progress', text: 'Keep learning, improving and investing in capability.' },
    ],
  },

  quality: {
    head: {
      eyebrow: 'Quality & manufacturing',
      title: 'Quality, built into the process.',
      lead: 'Explore our proposed approach to manufacturing, quality assurance and responsible product release.',
    },
    eyebrow: 'Quality & manufacturing',
    title: 'Care, built into every step.',
    lead: 'Our quality approach is designed around disciplined processes and continuous oversight. The final production stages below require company confirmation.',
    photoTag: 'Facility imagery for review',
    steps: [
      { title: 'Material receipt', text: 'Materials are received and documented before approved processing.' },
      { title: 'Production', text: 'Manufacturing follows approved batch records under supervision.' },
      { title: 'Testing', text: 'Samples are checked against approved specifications before release.' },
      { title: 'Release', text: 'A batch is released only after quality review and sign-off.' },
    ],
    certEyebrow: 'Standards & certification',
    certTitle: 'Evidence before claims.',
    certLead: 'Certificates will appear here only after current evidence has been supplied and verified.',
    certificates: [
      {
        /** Yellow pill; blank hides it. */
        status: 'Unconfirmed certificate',
        title: 'Certificate record awaiting evidence',
        text: 'Issuer, certificate number and validity date are required before publication.',
        /** Blank keeps the "View certificate" button disabled. */
        fileUrl: '',
      },
    ],
  },

  products: {
    head: {
      eyebrow: 'Product catalogue',
      title: 'Find a product.',
      lead: 'Search approved catalogue entries by brand or generic name.',
    },
    chip: 'Generic · Allopathic',
  },

  news: {
    head: {
      eyebrow: 'News & events',
      title: 'Updates from G.D. Pharmaceuticals.',
      lead: 'Company notices, stories and events, published with clear dates and supporting records.',
    },
    soonTitle: 'More updates coming soon',
    soonText: 'Approved company news and events will be published here.',
  },

  careers: {
    head: {
      eyebrow: 'Careers',
      title: 'Build better\nhealth with us.',
      lead: 'Explore opportunities to learn, contribute and grow with a pharmaceutical company rooted in Nepal.',
    },
    floatLabel: 'Open positions',
    floatTitle: 'Growing our team',
    whyEyebrow: 'Why join us',
    whyTitle: 'A purpose-driven place to grow.',
    whyLead:
      "We are building Nepal's pharmaceutical future. Join a team where your work directly improves community health.",
    why: [
      {
        title: 'Meaningful purpose',
        text: 'Every role contributes to making essential medicines accessible to Nepali communities.',
      },
      {
        title: 'Continuous growth',
        text: 'We invest in training and development so you can grow alongside a modern pharmaceutical company.',
      },
      {
        title: 'Science with care',
        text: 'Work with rigorous standards in an environment that balances scientific responsibility with human values.',
      },
    ],
    rolesEyebrow: 'Open roles',
    noRolesText: 'No openings match your search.',
    ctaEyebrow: "Don't see your role?",
    ctaTitle: "We'd love to hear from you.",
    ctaLead: 'Send us your CV and tell us where you could contribute.',
  },

  investors: {
    head: {
      eyebrow: 'Investor relations',
      title: 'Information for our stakeholders.',
      lead: 'Access company notices, governance updates and verified investor documents.',
    },
    emptyNotices: 'No company notices have been published yet.',
    emptyFinancial: 'No financial reports have been published yet. Verified reports will appear here.',
    emptyIpo: 'IPO updates will be posted once officially confirmed.',
    emptyGovernance: 'Governance documents are being prepared for review.',
  },

  contact: {
    head: {
      eyebrow: 'Contact',
      title: 'Let’s start a conversation.',
      lead: 'Tell us how we can help and your message will be directed to the right team.',
    },
    eyebrow: 'Get in touch',
    title: 'We’re here to help.',
    lead: 'For product, distributor, investor and general enquiries, complete the form and we’ll direct it.',
    formNote: 'We use these details only to respond to your enquiry.',
    successText: 'Thanks, {name}. Your enquiry {reference} has reached our team, and we will reply by email.',
  },
};

export type SiteContent = typeof DEFAULT_SITE_CONTENT;
