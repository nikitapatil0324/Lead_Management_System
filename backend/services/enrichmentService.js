const fetchEnrichmentData = async (leadName, leadEmail) => {
  try {
    const response = await fetch('https://randomuser.me/api/?inc=gender,location,picture,nat&noinfo');
    if (!response.ok) {
      throw new Error(`External enrichment API responded with status: ${response.status}`);
    }
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const user = data.results[0];
      
      const jobs = [
        'Software Development Engineer', 
        'Technical Product Manager', 
        'VP of Enterprise Sales', 
        'Marketing Operations Lead', 
        'Senior Solutions Architect', 
        'Business Development Executive'
      ];
      const companies = [
        'CloudScale Systems', 
        'InnovateLab Solutions', 
        'HyperGrowth Co', 
        'Apex Global Tech', 
        'Stellar Logistics', 
        'Synthetix Intelligence'
      ];
      
      const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
      const randomCompany = companies[Math.floor(Math.random() * companies.length)];
      
      return {
        job_title: randomJob,
        company: randomCompany,
        avatar_url: user.picture.large,
        nationality: user.nat,
        gender: user.gender,
        location: {
          city: user.location.city,
          state: user.location.state,
          country: user.location.country,
          postcode: user.location.postcode,
          coordinates: user.location.coordinates,
          timezone: user.location.timezone
        },
        enriched_at: new Date().toISOString(),
        status: 'success',
        source_api: 'https://randomuser.me/api/'
      };
    }
    throw new Error('Empty result from random user API.');
  } catch (error) {
    console.error('Enrichment Service (Using local fallback):', error.message);
    return {
      job_title: 'Lead Development Prospect',
      company: 'Enterprise Client Corp',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80',
      location: {
        city: 'Digital Remote',
        state: 'N/A',
        country: 'Global'
      },
      enriched_at: new Date().toISOString(),
      status: 'fallback_mock',
      error: error.message
    };
  }
};

module.exports = {
  fetchEnrichmentData,
};
