import React from 'react';
import { SafeAreaView, View, Button, Text, StyleSheet, Alert, ScrollView, Platform } from 'react-native'; // Added ScrollView

// Turf.js v6.x module imports
import { lineString, polygon, feature, point, AllGeoJSON } from '@turf/helpers'; // Added point, AllGeoJSON
import lineIntersect from '@turf/line-intersect';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'; // For manual segmentation
import lineSlice from '@turf/line-slice';                         // For manual segmentation
import midpoint from '@turf/midpoint';                             // For manual segmentation
import area from '@turf/area';
import length from '@turf/length'; // Assuming you installed @turf/length@^6.5.0
                                   // If you rely on the main @turf/turf for length, and it's v6, it might be different.
                                   // For clarity, using the specific module is better if available.

// GeoJSON Types
import type { Feature, Polygon, LineString, Point, FeatureCollection, MultiPolygon, GeoJsonProperties, Position, BBox } from 'geojson';

// Load your state boundaries GeoJSON
// Path: TestTurfApp/app/screens/HomeScreen.tsx -> TestTurfApp/assets/admin1_boundaries.json
// So, from 'app/screens/' go up two levels to 'TestTurfApp/' then into 'assets/'
const stateBoundariesGeoJSON = require('../../assets/admin1_boundaries.json');

const HomeScreen = () => {
  const [testResults, setTestResults] = React.useState<string[]>([]);

  const logResult = (message: string, data?: any) => {
    // For console logging, keep complex objects expandable
    if (typeof data !== 'undefined') {
      console.log(message, data);
    } else {
      console.log(message);
    }
    // For on-screen display, stringify data
    const displayMessage = data ? `${message} ${JSON.stringify(data, null, 2)}` : message; // Prettify JSON
    setTestResults(prev => [...prev, displayMessage]);
  };

  const runBasicTurfTests = async () => {
    // Clear results for this specific test run
    // setTestResults([]); // Let's keep results additive or clear them per button press
    logResult("--- Starting Basic Turf.js Tests ---");

    // Test 1: Simpler Turf Test (area)
    logResult("\nGeoProcessingService: --- Starting Simpler Turf Test (area) ---");
    try {
        const simpleTestPoly = polygon([[
            [-1.0, -1.0], [1.0, -1.0], [1.0, 1.0], [-1.0, 1.0], [-1.0, -1.0]
        ]], { name: "Simple Test Square" });
        const calculatedArea = area(simpleTestPoly);
        logResult("GeoProcessingService: Simpler Turf Test (area) - Area calculated:", calculatedArea);
        if (typeof calculatedArea === 'number' && calculatedArea > 0) {
            logResult("GeoProcessingService: Simpler Turf Test (area) - SUCCESS!");
        } else {
             logResult("GeoProcessingService: Simpler Turf Test (area) - FAILED (area not positive number).");
        }
    } catch (simpleTestError: any) {
        logResult("GeoProcessingService: Simpler Turf Test (area) FAILED with error:", simpleTestError.message);
        console.error(simpleTestError.stack);
    }
    logResult("GeoProcessingService: --- Finished Simpler Turf Test (area) ---");


    logResult("\nGeoProcessingService: --- Starting Direct Turf Test (lineIntersect with basic shapes) ---");
    try {
        const testPolyFeatureForIntersect: Feature<Polygon> = polygon([[
            [-1.0, -1.0], [1.0, -1.0], [1.0, 1.0], [-1.0, 1.0], [-1.0, -1.0]
        ]], { name: "Test Square for Intersect" });

        const testLineFeatForIntersect: Feature<LineString> = lineString([[-2.0, 0.0], [2.0, 0.0]], { name: "Test Line for Intersect" });
        
        logResult("Test Polygon Feature (for lineIntersect):", testPolyFeatureForIntersect.geometry);
        logResult("Test Line Feature (for lineIntersect):", testLineFeatForIntersect.geometry);

        const intersectionResult = lineIntersect(testLineFeatForIntersect, testPolyFeatureForIntersect.geometry); // Pass geometry
        logResult("GeoProcessingService: lineIntersect result with basic shapes:", intersectionResult);

        if (intersectionResult && intersectionResult.features && intersectionResult.features.length >= 2) {
            logResult("GeoProcessingService: Direct Turf Test (lineIntersect basic) - SUCCESS! Found intersection points.");
            const firstPoint = intersectionResult.features[0].geometry.coordinates;
            const secondPoint = intersectionResult.features[1].geometry.coordinates;
            // Ensure points are not identical before creating a line
            if(JSON.stringify(firstPoint) !== JSON.stringify(secondPoint)) {
                const intersectingSegment = lineString([firstPoint, secondPoint]);
                const len = length(intersectingSegment, {units: 'miles'});
                logResult("GeoProcessingService: Approx length of intersecting segment from points:", len);
                if (len > 0) {
                    logResult("GeoProcessingService: Direct Turf Test (lineIntersect basic) - Intersection length calculated - SUCCESS CONFIRMED!");
                } else {
                      logResult("GeoProcessingService: Direct Turf Test (lineIntersect basic) - Calculated length is 0 - POTENTIAL ISSUE or line is vertical/horizontal along axis.");
                }
            } else {
                logResult("GeoProcessingService: Direct Turf Test (lineIntersect basic) - Intersection points are identical.");
            }
        } else {
            logResult("GeoProcessingService: Direct Turf Test (lineIntersect basic) FAILED - Did not find expected number of intersection points.");
        }
    } catch (testError: any) {
        logResult("GeoProcessingService: Direct Turf Test (lineIntersect basic) FAILED with error:", testError.message);
        console.error(testError.stack);
    }
    logResult("GeoProcessingService: --- Finished Direct Turf Test (lineIntersect with basic shapes) ---");

    logResult("\n--- Finished Basic Turf.js Tests ---");
    Alert.alert("Basic Turf Tests", "Basic tests finished. Check console and screen.");
  };


  const testManualLineSegmentation = async () => {
    setTestResults([]); // Clear previous results for this specific test
    logResult("--- Starting Manual Line Segmentation Test ---");

    const targetStateName = "Washington"; // Make sure this state exists
    const stateFeatureRaw = stateBoundariesGeoJSON.features.find(
      (f: Feature<Polygon | MultiPolygon, any>) => f.properties && f.properties.name === targetStateName
    );

    if (!stateFeatureRaw) {
      logResult(`ERROR: State "${targetStateName}" not found in GeoJSON.`);
      Alert.alert("Error", `State "${targetStateName}" not found.`);
      return;
    }
    const stateFeature = stateFeatureRaw as Feature<Polygon | MultiPolygon>; // Cast for Turf functions
    logResult(`Found state: ${targetStateName}`);

    // IMPORTANT: Use coordinates that you have VERIFIED cross Washington state from your admin1_boundaries.json
    // The example coordinates might need adjustment.
    const sampleStepCoords: Position[] = [
        [-117.42990830255845, 47.65688579301931], // Outside WA (e.g., Oregon)
        [-117.26456350542409, 47.66573346066775],
        [-117.1150197518266, 47.675542047852375],
        [-116.95333769841587, 47.71835127805564],
        [-116.78882326681907, 47.676118098448754]  // Inside WA
    ];
    const sampleStepLine = lineString(sampleStepCoords, { name: "Test drive into WA" });
    logResult("Sample step line coordinates:", sampleStepCoords);

    let totalLengthInState = 0;

    try {
      logResult("\n1. Finding intersection points with state boundary...");
      const intersectionPointsResult = lineIntersect(sampleStepLine, stateFeature.geometry); // Pass geometry
      logResult("Intersection points with state boundary:", intersectionPointsResult.features.map(f => f.geometry.coordinates));

      const criticalCoords: Position[] = [];
      criticalCoords.push(sampleStepLine.geometry.coordinates[0]); // Start of the original line

      intersectionPointsResult.features.forEach(pFeature => {
        criticalCoords.push(pFeature.geometry.coordinates);
      });

      criticalCoords.push(sampleStepLine.geometry.coordinates[sampleStepLine.geometry.coordinates.length - 1]); // End of the original line

      // Remove duplicate coordinates (important for sorting and slicing)
      const uniqueCoordsStrings = new Set(criticalCoords.map(c => JSON.stringify(c)));
      let sortedUniqueCriticalCoords = Array.from(uniqueCoordsStrings).map(s => JSON.parse(s) as Position);

      // Sort points based on their order along the original line.
      // This is complex. A simple spatial sort might not be enough for complex lines.
      // For this test, we'll use a simplified sort. If your line is mostly N-S, sort by Y then X. If E-W, sort by X then Y.
      // A truly robust sort would project points onto the line and use distance along.
      // Example for a line generally going from SW to NE:
      sortedUniqueCriticalCoords.sort((a, b) => {
        if (a[0] !== b[0]) return a[0] - b[0]; // Sort by longitude
        return a[1] - b[1]; // Then by latitude
      });
      // IF YOUR LINE IS DIFFERENT, ADJUST SORTING!
      // E.g., for a line from Portland to central WA (NW direction):
      // sortedUniqueCriticalCoords.sort((a, b) => {
      //   if (a[1] !== b[1]) return a[1] - b[1]; // Sort by latitude (south to north)
      //   return b[0] - a[0]; // Then by longitude (east to west for NW)
      // });

      logResult("Sorted unique critical points for slicing:", sortedUniqueCriticalCoords);

      if (sortedUniqueCriticalCoords.length < 2) {
        logResult("Not enough unique critical points (<2) to form segments. Checking if whole line is inside/outside.");
        // For a line to be entirely inside/outside without intersection points, 
        // it must not cross the boundary. Check midpoint.
        const startPtOfLine = point(sampleStepLine.geometry.coordinates[0]); // Use point() helper
        if (booleanPointInPolygon(startPtOfLine, stateFeature.geometry)) {
          totalLengthInState = length(sampleStepLine, { units: 'miles' });
          logResult(`Line starts INSIDE ${targetStateName} and no intersections. Assuming full length: ${totalLengthInState.toFixed(3)} miles.`);
        } else {
          logResult(`Line starts OUTSIDE ${targetStateName} and no intersections. Assuming zero length in state.`);
        }
      } else {
        logResult("\n2. Creating and testing sub-segments...");
        for (let i = 0; i < sortedUniqueCriticalCoords.length - 1; i++) {
          const pt1 = sortedUniqueCriticalCoords[i];
          const pt2 = sortedUniqueCriticalCoords[i + 1];

          if (JSON.stringify(pt1) === JSON.stringify(pt2)) {
            logResult(`Skipping identical points for segment: ${JSON.stringify(pt1)}`);
            continue;
          }

          const subSegmentLine = lineString([pt1, pt2]);
          logResult(`Testing sub-segment from ${JSON.stringify(pt1)} to ${JSON.stringify(pt2)}`);
          
          // *** MIDPOINT FIX HERE ***
          // midpoint expects two points (or coordinates), not a lineString.
          const p1Feature = point(pt1); // Use point helper from @turf/helpers
          const p2Feature = point(pt2);
          const midPtOfSubsegment = midpoint(p1Feature, p2Feature); // Now takes two points

          if (booleanPointInPolygon(midPtOfSubsegment, stateFeature.geometry)) {
            const segmentLengthVal = length(subSegmentLine, { units: 'miles' });
            logResult(`  -> Midpoint INSIDE. Segment length: ${segmentLengthVal.toFixed(3)} miles.`);
            totalLengthInState += segmentLengthVal;
          } else {
            logResult("  -> Midpoint OUTSIDE.");
          }
        }
      }
      logResult(`\nTotal calculated length in ${targetStateName}: ${totalLengthInState.toFixed(3)} miles`);
      if (totalLengthInState > 0) {
         logResult("Manual Segmentation Test - VIABLE (produced some length)!");
      } else {
         logResult("Manual Segmentation Test - No length found in state (or line doesn't cross, or logic/sort error).");
      }

    } catch (err: any) {
      logResult("ERROR in manual segmentation test:", err.message);
      console.error(err.stack);
    }
    logResult("--- Finished Manual Line Segmentation Test ---");
    Alert.alert("Manual Seg Test Done", "Check console/screen.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button title="Run Basic Turf Tests" onPress={runBasicTurfTests} />
        <Button title="Test Manual State Segmentation" onPress={testManualLineSegmentation} />
      </View>
      <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.resultsContent}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Changed background for better text visibility
  },
  buttonContainer: {
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  resultsScroll: {
    flex: 1,
    backgroundColor: '#f8f8f8', // Lighter background for scroll
  },
  resultsContent: {
    padding: 10,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  resultText: {
    fontSize: 11, // Smaller for more text
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', // Monospace for better JSON
    color: '#444',
    flexWrap: 'wrap', // Allow text to wrap
  }
});

export default HomeScreen;