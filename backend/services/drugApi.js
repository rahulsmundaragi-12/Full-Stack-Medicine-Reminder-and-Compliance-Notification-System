const axios = require('axios');

// Cache for storing interaction results to minimize API calls
const interactionCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

class DrugApiService {
  constructor() {
    this.apiKey = process.env.DRUG_API_KEY;
    this.baseUrl = process.env.DRUG_API_BASE_URL;
  }

  /**
   * Generate a cache key for a set of medicines
   */
  getCacheKey(medicines) {
    return medicines
      .map(m => m.name.toLowerCase())
      .sort()
      .join('|');
  }

  /**
   * Check if we have a valid cached result
   */
  getCachedInteractions(medicines) {
    const key = this.getCacheKey(medicines);
    const cached = interactionCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Store interaction results in cache
   */
  cacheInteractions(medicines, interactions) {
    const key = this.getCacheKey(medicines);
    interactionCache.set(key, {
      data: interactions,
      timestamp: Date.now()
    });
  }

  /**
   * Check for drug interactions between a list of medicines
   */
  async checkInteractions(medicines) {
    try {
      // Check cache first
      const cached = this.getCachedInteractions(medicines);
      if (cached) return cached;

      // Make API request
      const response = await axios.post(
        `${this.baseUrl}/interactions`,
        {
          drugs: medicines.map(m => ({
            name: m.name,
            dosage: m.dosage
          }))
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Process and format the response
      const interactions = this.processInteractions(response.data);
      
      // Cache the results
      this.cacheInteractions(medicines, interactions);

      return interactions;
    } catch (error) {
      console.error('Drug API Error:', error.message);
      if (error.response?.data) {
        console.error('API Response:', error.response.data);
      }
      throw new Error('Failed to check drug interactions');
    }
  }

  /**
   * Process and format interaction data from the API
   */
  processInteractions(apiResponse) {
    // This implementation will need to be adjusted based on the actual API response format
    return apiResponse.interactions.map(interaction => ({
      id: interaction.id,
      medicines: interaction.drugs,
      severity: interaction.severity,
      description: interaction.description,
      management: interaction.management,
      reference: interaction.reference,
      lastUpdated: new Date(interaction.lastUpdated)
    }));
  }

  /**
   * Validate a medicine against existing medicines for interactions
   * Returns null if no critical interactions, otherwise returns the interaction details
   */
  async validateMedicine(newMedicine, existingMedicines) {
    const allMedicines = [...existingMedicines, newMedicine];
    const interactions = await this.checkInteractions(allMedicines);

    // Filter for critical interactions involving the new medicine
    const criticalInteractions = interactions.filter(interaction => {
      const involvesCurrent = interaction.medicines.some(
        med => med.name.toLowerCase() === newMedicine.name.toLowerCase()
      );
      return involvesCurrent && interaction.severity === 'major';
    });

    return criticalInteractions.length > 0 ? criticalInteractions : null;
  }
}

module.exports = new DrugApiService(); 