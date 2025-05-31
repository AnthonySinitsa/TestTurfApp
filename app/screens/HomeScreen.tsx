import React from 'react';
import { SafeAreaView, View, Button, Text, StyleSheet, Alert } from 'react-native';
import { lineString, polygon, feature } from '@turf/helpers';
import lineIntersect from '@turf/line-intersect'; // This is the key change
import area from '@turf/area';
import length from '@turf/length';

// Define the types for GeoJSON Features if not automatically inferred strongly enough
import type { Feature, Polygon, LineString, Point, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

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


    console.log("GeoProcessingService: --- Starting Direct Turf Test (lineIntersect) ---");
    try {
        const testPolyFeature: Feature<Polygon> = polygon([[ // Explicitly type for clarity
            [-1.0, -1.0], [1.0, -1.0], [1.0, 1.0], [-1.0, 1.0], [-1.0, -1.0]
        ]], { name: "Test Square" });

        const testLineFeat: Feature<LineString> = lineString([[-2.0, 0.0], [2.0, 0.0]], { name: "Test Line" });
        
        console.log("Test Polygon Feature (for lineIntersect):", JSON.stringify(testPolyFeature));
        console.log("Test Line Feature (for lineIntersect):", JSON.stringify(testLineFeat));

        // Use lineIntersect
        const intersectionResult: FeatureCollection<Point> = lineIntersect(testLineFeat, testPolyFeature); 
        // Note: The order might matter: line first, then polygon. Or vice-versa. Check docs if needed.
        // Common signature: lineIntersect(line1, line2 | polygon1)

        console.log("GeoProcessingService: lineIntersect result:", JSON.stringify(intersectionResult));

        if (intersectionResult && intersectionResult.features && intersectionResult.features.length > 0) {
            console.log(`GeoProcessingService: Direct Turf Test (lineIntersect) found ${intersectionResult.features.length} intersection points/segments.`);
            // For a line passing through a polygon, we expect 2 points.
            // The "intersectionResult" itself is a FeatureCollection of these points.
            // To get the *actual line segment* that is inside, we'd need more logic:
            // 1. Take the original line (testLineFeat).
            // 2. Slice it or clip it using the polygon (turf.lineclip or a similar boolean operation might be needed here,
            //    or we manually construct the line from the intersection points if they are ordered and from the same line segment).
            // This is more complex than turf.intersect if turf.intersect was working as expected for LineString/Polygon.

            // For now, just checking if it found points is a success for lineIntersect itself.
            // Calculating the length of the INTERSECTING SEGMENT is more complex with lineIntersect's output.
            // turf.intersect (if it worked) would give you the LineString segment directly.

            // Let's check if we got any points, which means it "worked"
            if (intersectionResult.features.length >= 2) { // Expect 2 points for a line passing through
                console.log("GeoProcessingService: Direct Turf Test (lineIntersect) - SUCCESS! Found intersection points.");
                // To actually calculate the length of the segment *inside* the polygon using only lineIntersect output,
                // you would need to sort the points and create a new LineString from them, then measure its length.
                // This is a simplification for now.
                const firstPoint = intersectionResult.features[0].geometry.coordinates;
                const secondPoint = intersectionResult.features[1].geometry.coordinates;
                const intersectingSegment = lineString([firstPoint, secondPoint]);
                const len = length(intersectingSegment, {units: 'miles'}); // Ensure length is from @turf/turf or @turf/length
                console.log("GeoProcessingService: Approx length of intersecting segment from points:", len);
                if (len > 0) {
                    console.log("GeoProcessingService: Direct Turf Test (lineIntersect) - Intersection length calculated - SUCCESS CONFIRMED!");
                } else {
                      console.error("GeoProcessingService: Direct Turf Test (lineIntersect) - Calculated length is 0 - FAILED.");
                }

            } else {
                console.warn("GeoProcessingService: Direct Turf Test (lineIntersect) - Did not find expected number of intersection points.");
            }

        } else {
            console.error("GeoProcessingService: Direct Turf Test (lineIntersect) FAILED - No intersection points found.");
        }
    } catch (testError: any) {
        console.error("GeoProcessingService: Direct Turf Test (lineIntersect) FAILED with error:", testError.message, testError.stack);
    }
    console.log("GeoProcessingService: --- Finished Direct Turf Test (lineIntersect) ---");

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