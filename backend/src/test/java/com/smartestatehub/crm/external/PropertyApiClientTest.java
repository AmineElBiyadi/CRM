package com.smartestatehub.crm.external;

import com.smartestatehub.crm.dto.PropertyDto;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Method;
import static org.junit.jupiter.api.Assertions.*;

public class PropertyApiClientTest {

    @Test
    public void testSqftToM2Conversion() throws Exception {
        PropertyApiClient client = new PropertyApiClient();
        
        // Mock JSON response avec 1000 sqft
        String mockJson = "{\"properties\": [{\"property_id\": \"1\", \"price\": 500000, \"beds\": 3, \"sqft\": 1000, \"address\": {\"line\": \"123 St\", \"city\": \"NY\"}}], \"total_count\": 1}";
        
        // Utilisation de la réflexion pour tester la méthode privée parseApiResponse
        Method method = PropertyApiClient.class.getDeclaredMethod("parseApiResponse", String.class, int.class);
        method.setAccessible(true);
        
        PropertyDto.SearchResponse response = (PropertyDto.SearchResponse) method.invoke(client, mockJson, 1);
        
        assertNotNull(response);
        assertEquals(1, response.getResults().size());
        
        // 1000 sqft * 0.092903 = 92.903 -> arrondi à 92.9
        assertEquals(92.9, response.getResults().get(0).getSurfaceM2());
        assertEquals(500000.0, response.getResults().get(0).getPrice());
    }
}
