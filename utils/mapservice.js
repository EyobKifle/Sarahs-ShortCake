const axios = require('axios');

class MapService {
  /**
   * Free geocoding using OpenStreetMap Nominatim
   * @param {string} address - The address to geocode
   * @returns {Promise<Object>} - Geocoding result
   */
  static async geocodeAddress(address) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'SarahsShortCakes/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        return {
          latitude: parseFloat(response.data[0].lat),
          longitude: parseFloat(response.data[0].lon),
          formattedAddress: response.data[0].display_name
        };
      }
      throw new Error('No results found for this address');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * @param {Object} point1 - {latitude, longitude}
   * @param {Object} point2 - {latitude, longitude}
   * @returns {number} - Distance in kilometers
   */
  static calculateDistance(point1, point2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(point2.latitude - point1.latitude);
    const dLon = toRad(point2.longitude - point1.longitude);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(point1.latitude)) * 
      Math.cos(toRad(point2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get simple route information (no turn-by-turn)
   * @param {Object} origin - {latitude, longitude}
   * @param {Object} destination - {latitude, longitude}
   * @returns {Promise<Object>} - Basic route info
   */
  static async getRouteInfo(origin, destination) {
    try {
      const distance = this.calculateDistance(origin, destination);
      return {
        distance: distance,
        unit: 'km',
        estimatedTime: distance * 2 // Rough estimate: 2 minutes per km
      };
    } catch (error) {
      console.error('Route calculation error:', error);
      throw error;
    }
  }
}

module.exports = MapService;
