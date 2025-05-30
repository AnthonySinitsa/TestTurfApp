import React from 'react';
import { SafeAreaView, View, Button, Text, StyleSheet, Alert } from 'react-native';
import { intersect, polygon, lineString, area, length } from '@turf/turf'; // Direct imports

// Define the types for GeoJSON Features if not automatically inferred strongly enough
import type { Feature, Polygon, LineString, Point, FeatureCollection } from 'geojson';

const HomeScreen = () => {

  const runTurfTests = async () => {
    Alert.alert("Turf Tests", "Running Turf.js tests. Check Metro Bundler console for logs.");
    console.log("--- Starting Turf.js Tests in Fresh App ---");

    // Test 1: Simpler Turf Test (area)
    console.log("GeoProcessingService: --- Starting Simpler Turf Test (area) ---");
    try {
        const simpleTestPoly = polygon([[
            [-1.0, -1.0], [1.0, -1.0], [1.0, 1.0], [-1.0, 1.0], [-1.0, -1.0]
        ]], { name: "Simple Test Square" });
        const calculatedArea = area(simpleTestPoly);
        console.log("GeoProcessingService: Simpler Turf Test (area) - Area calculated:", calculatedArea);
        if (typeof calculatedArea === 'number' && calculatedArea > 0) {
            console.log("GeoProcessingService: Simpler Turf Test (area) - SUCCESS!");
        } else {
             console.error("GeoProcessingService: Simpler Turf Test (area) - FAILED (area not positive number).");
        }
    } catch (simpleTestError: any) {
        console.error("GeoProcessingService: Simpler Turf Test (area) FAILED with error:", simpleTestError.message, simpleTestError.stack);
    }
    console.log("GeoProcessingService: --- Finished Simpler Turf Test (area) ---");


    // Test 2: Direct Turf Test (intersect) - Original way
    console.log("GeoProcessingService: --- Starting Direct Turf Test (intersect - Feature vs Feature) ---");
    try {
        const testPolyFeature = polygon([[
            [-1.0, -1.0], [1.0, -1.0], [1.0, 1.0], [-1.0, 1.0], [-1.0, -1.0]
        ]], { name: "Test Square" });

        const testLineFeat = lineString([[-2.0, 0.0], [2.0, 0.0]], { name: "Test Line" });
        
        console.log("Test Polygon Feature (for intersect):", JSON.stringify(testPolyFeature));
        console.log("Test Line Feature (for intersect):", JSON.stringify(testLineFeat));

        // Check for TypeScript error here by hovering over testPolyFeature in the intersect call
        const testIntersection = intersect(testPolyFeature, testLineFeat);

        if (testIntersection) {
            console.log("GeoProcessingService: Direct Turf Test (Feature vs Feature) SUCCEEDED. Intersection:", JSON.stringify(testIntersection));
            const testLen = length(testIntersection, { units: 'miles' });
            console.log("GeoProcessingService: Direct Turf Test (Feature vs Feature) intersection length:", testLen);
            if (testLen > 0) {
                console.log("GeoProcessingService: Direct Turf Test (Feature vs Feature) - SUCCESS CONFIRMED!");
            } else {
                 console.error("GeoProcessingService: Direct Turf Test (Feature vs Feature) - Intersection length is 0 or less - FAILED.");
            }
        } else {
            console.error("GeoProcessingService: Direct Turf Test (Feature vs Feature) INTERSECTION IS NULL - FAILED.");
        }
    } catch (testError: any) {
        console.error("GeoProcessingService: Direct Turf Test (Feature vs Feature) FAILED with error:", testError.message, testError.stack);
    }
    console.log("GeoProcessingService: --- Finished Direct Turf Test (intersect - Feature vs Feature) ---");


    // Test 3: Direct Turf Test (intersect) - With FeatureCollection Hack
    console.log("GeoProcessingService: --- Starting Direct Turf Test (intersect - FC Hack) ---");
    try {
        const fcTestPolyFeature = polygon([[
            [-1.0, -1.0], [1.0, -1.0], [1.0, 1.0], [-1.0, 1.0], [-1.0, -1.0]
        ]], { name: "FC Test Square" });

        const testPolygonFeatureCollection = {
            type: "FeatureCollection" as "FeatureCollection", // Explicit cast
            features: [fcTestPolyFeature]
        };

        const fcTestLineFeat = lineString([[-2.0, 0.0], [2.0, 0.0]], { name: "FC Test Line" });

        console.log("Test Polygon FeatureCollection (for FC Hack intersect):", JSON.stringify(testPolygonFeatureCollection));
        console.log("Test Line Feature (for FC Hack intersect):", JSON.stringify(fcTestLineFeat));
        
        // Check for TypeScript error here by hovering over testPolygonFeatureCollection
        const fcTestIntersection = intersect(testPolygonFeatureCollection, fcTestLineFeat);

        if (fcTestIntersection) {
            console.log("GeoProcessingService: Direct Turf Test (FC Hack) SUCCEEDED. Intersection:", JSON.stringify(fcTestIntersection));
            const fcTestLen = length(fcTestIntersection, { units: 'miles' });
            console.log("GeoProcessingService: Direct Turf Test (FC Hack) intersection length:", fcTestLen);
             if (fcTestLen > 0) {
                console.log("GeoProcessingService: Direct Turf Test (FC Hack) - SUCCESS CONFIRMED!");
            } else {
                 console.error("GeoProcessingService: Direct Turf Test (FC Hack) - Intersection length is 0 or less - FAILED.");
            }
        } else {
            console.error("GeoProcessingService: Direct Turf Test (FC Hack) INTERSECTION IS NULL - FAILED.");
        }
    } catch (testError: any)
     {
        console.error("GeoProcessingService: Direct Turf Test (FC Hack) FAILED with error:", testError.message, testError.stack);
    }
    console.log("GeoProcessingService: --- Finished Direct Turf Test (intersect - FC Hack) ---");

    console.log("--- Finished ALL Turf.js Tests in Fresh App ---");
    Alert.alert("Turf Tests", "Tests finished. Check Metro Bundler console for results.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Turf.js Test App</Text>
        <Button title="Run Turf.js Tests" onPress={runTurfTests} />
        <Text style={styles.instructions}>
          Press the button and check the Metro Bundler console for test results.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  instructions: {
    marginTop: 20,
    textAlign: 'center',
    color: '#333',
  }
});

export default HomeScreen; // Or export default App; if you modified App.tsx directly