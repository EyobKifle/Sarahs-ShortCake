// Initialize map functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if map container exists
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        initMapService();
    }
});

async function initMapService() {
    try {
        // Example usage of the map service
        const response = await fetch('/api/maps/geocode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address: 'Default Location'
            })
        });
        const location = await response.json();
        
        // Implement your map visualization here
        console.log('Map service initialized with location:', location);
    } catch (error) {
        console.error('Error initializing map service:', error);
    }
}

// Function to calculate distance between two points
async function calculateDistance(origin, destination) {
    try {
        const response = await fetch('/api/maps/distance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ origin, destination })
        });
        return await response.json();
    } catch (error) {
        console.error('Error calculating distance:', error);
        throw error;
    }
}
