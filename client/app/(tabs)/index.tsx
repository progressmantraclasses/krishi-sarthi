import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions,
  Animated,
  Easing
} from "react-native";
import BigButton from "../../components/BigButton";
import Card from "../../components/Card";

const { width, height } = Dimensions.get("window");

// Farm Animation Component
const FarmAnimation = () => {
  const windAnimation = React.useRef(new Animated.Value(0)).current;
  const sunAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Wind swaying animation
    const windLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(windAnimation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(windAnimation, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Sun glow animation
    const sunLoop = Animated.loop(
      Animated.timing(sunAnimation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );

    windLoop.start();
    sunLoop.start();

    return () => {
      windLoop.stop();
      sunLoop.stop();
    };
  }, []);

  const windTranslate = windAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, 5],
  });

  const sunOpacity = sunAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 1, 0.7],
  });

  return (
    <View style={s.farmContainer}>
      {/* Sky Background */}
      <View style={s.sky} />
      
      {/* Sun */}
      <Animated.View style={[s.sun, { opacity: sunOpacity }]}>
        <Text style={s.sunEmoji}>☀️</Text>
      </Animated.View>

      {/* Clouds */}
      <View style={s.cloud1}>
        <Text style={s.cloudEmoji}>☁️</Text>
      </View>
      <View style={s.cloud2}>
        <Text style={s.cloudEmoji}>☁️</Text>
      </View>

      {/* Farm Field */}
      <View style={s.field}>
        {/* Crops with wind animation - All placed in green field area */}
        <Animated.View style={[s.cropRow, { transform: [{ translateX: windTranslate }] }]}>
          <Text style={s.crop}>🌾</Text>
          <Text style={s.crop}>🌽</Text>
          <Text style={s.crop}>🥕</Text>
          <Text style={s.crop}>🌿</Text>
          <Text style={s.crop}>🍅</Text>
          <Text style={s.crop}>🌱</Text>
          <Text style={s.crop}>🥬</Text>
        </Animated.View>
        
        <Animated.View style={[s.cropRow, { transform: [{ translateX: windTranslate * -0.8 }] }]}>
          <Text style={s.crop}>🌽</Text>
          <Text style={s.crop}>🌾</Text>
          <Text style={s.crop}>🌿</Text>
          <Text style={s.crop}>🥕</Text>
          <Text style={s.crop}>🌱</Text>
          <Text style={s.crop}>🍅</Text>
          <Text style={s.crop}>🥬</Text>
        </Animated.View>

        <Animated.View style={[s.cropRow, { transform: [{ translateX: windTranslate * 0.6 }] }]}>
          <Text style={s.crop}>🥕</Text>
          <Text style={s.crop}>🥬</Text>
          <Text style={s.crop}>🌾</Text>
          <Text style={s.crop}>🌽</Text>
          <Text style={s.crop}>🌿</Text>
          <Text style={s.crop}>🌱</Text>
          <Text style={s.crop}>🍅</Text>
        </Animated.View>

        <Animated.View style={[s.cropRow, { transform: [{ translateX: windTranslate * -0.4 }] }]}>
          <Text style={s.crop}>🌿</Text>
          <Text style={s.crop}>🍅</Text>
          <Text style={s.crop}>🌱</Text>
          <Text style={s.crop}>🥬</Text>
          <Text style={s.crop}>🌾</Text>
          <Text style={s.crop}>🌽</Text>
          <Text style={s.crop}>🥕</Text>
        </Animated.View>

        <Animated.View style={[s.cropRow, { transform: [{ translateX: windTranslate * 0.3 }] }]}>
          <Text style={s.crop}>🍅</Text>
          <Text style={s.crop}>🌱</Text>
          <Text style={s.crop}>🥬</Text>
          <Text style={s.crop}>🌾</Text>
          <Text style={s.crop}>🌽</Text>
          <Text style={s.crop}>🥕</Text>
          <Text style={s.crop}>🌿</Text>
        </Animated.View>

        <Animated.View style={[s.cropRow, { transform: [{ translateX: windTranslate * -0.2 }] }]}>
          <Text style={s.crop}>🌱</Text>
          <Text style={s.crop}>🥬</Text>
          <Text style={s.crop}>🌾</Text>
          <Text style={s.crop}>🌽</Text>
          <Text style={s.crop}>🥕</Text>
          <Text style={s.crop}>🌿</Text>
          <Text style={s.crop}>🍅</Text>
        </Animated.View>
      </View>

      {/* Farm Elements */}
      <View style={s.farmhouse}>
        <Text style={s.farmhouseEmoji}>🏠</Text>
      </View>
      
      <View style={s.tractor}>
        <Text style={s.tractorEmoji}>🚜</Text>
      </View>
    </View>
  );
};

export default function Home() {
  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Professional Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Namaste, Kisan</Text>
          <Text style={s.tagline}>Intelligent Agriculture Solutions</Text>
        </View>
        <View style={s.headerIcon}>
          <Text style={s.headerIconText}>🌾</Text>
        </View>
      </View>

      {/* Professional Farm Animation */}
      <Card style={s.farmCard}>
        <FarmAnimation />
        <View style={s.farmOverlay}>
          <Text style={s.farmTitle}>Your krishi Sarthi Assistant</Text>
          {/* <Text style={s.farmSubtitle}>Powered by AI Technology</Text> */}
        </View>
      </Card>

      {/* Professional Quick Actions */}
      <Card style={s.actionsCard}>
        <Text style={s.sectionTitle}>Agricultural Services</Text>
        <Text style={s.sectionSubtitle}>Professional farming tools at your fingertips</Text>
        <View style={s.actions}>
          <View style={s.actionItem}>
            <BigButton
              title="AI Advisor"
              icon="chatbubble-ellipses"
              href="/(tabs)/advisory"
            />
          </View>
          <View style={s.actionItem}>
            <BigButton 
              title="Pest Detection" 
              icon="bug" 
              href="/(tabs)/pest"
            />
          </View>
          <View style={s.actionItem}>
            <BigButton 
              title="Weather Insights" 
              icon="cloud" 
              href="/(tabs)/weather"
            />
          </View>
          <View style={s.actionItem}>
            <BigButton 
              title="Market Analysis" 
              icon="trending-up" 
              href="/(tabs)/market"
            />
          </View>
        </View>
      </Card>

      {/* Professional Daily Insights */}
      <Card style={s.insightsCard}>
        <View style={s.insightHeader}>
          <View>
            <Text style={s.sectionTitle}>Today's Agricultural Insights</Text>
            <Text style={s.insightDate}>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</Text>
          </View>
          <Text style={s.insightIcon}>💡</Text>
        </View>
        
        <View style={s.insightContent}>
          <View style={s.insightItem}>
            <Text style={s.insightLabel}>Recommended Action:</Text>
            <Text style={s.insightText}>
              Apply irrigation during early morning hours (5-7 AM) to minimize water loss and reduce fungal disease risk.
            </Text>
          </View>
          
          <View style={s.insightDivider} />
          
          <View style={s.insightItem}>
            <Text style={s.insightLabel}>Weather Alert:</Text>
            <Text style={s.insightText}>
              Monitor crops closely - optimal growing conditions expected for the next 3 days.
            </Text>
          </View>
        </View>
      </Card>

      {/* Professional Statistics Card */}
      <Card style={s.statsCard}>
        <Text style={s.sectionTitle}>Farm Productivity</Text>
        <View style={s.statsContainer}>
          <View style={s.statItem}>
            <Text style={s.statValue}>98%</Text>
            <Text style={s.statLabel}>Crop Health</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>24°C</Text>
            <Text style={s.statLabel}>Temperature</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>75%</Text>
            <Text style={s.statLabel}>Soil Moisture</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },
  container: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 8,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1B5E20",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: "#616161",
    marginTop: 4,
    fontWeight: "500",
  },
  headerIcon: {
    width: 50,
    height: 50,
    backgroundColor: "#E8F5E9",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  headerIconText: {
    fontSize: 24,
  },
  
  // Farm Animation Styles
  farmCard: {
    marginBottom: 24,
    padding: 0,
    height: width * 0.55,
    overflow: "hidden",
  },
  farmContainer: {
    flex: 1,
    position: "relative",
  },
  sky: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "#87CEEB",
  },
  sun: {
    position: "absolute",
    top: 20,
    right: 30,
  },
  sunEmoji: {
    fontSize: 32,
  },
  cloud1: {
    position: "absolute",
    top: 30,
    left: 20,
  },
  cloud2: {
    position: "absolute",
    top: 50,
    right: 80,
  },
  cloudEmoji: {
    fontSize: 24,
    opacity: 0.8,
  },
  field: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "45%",
    backgroundColor: "#8BC34A",
    justifyContent: "space-evenly",
    paddingHorizontal: 20,
    paddingVertical: -10,
  },
  cropRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 2,
  },
  crop: {
    fontSize: 20,
  },
  farmhouse: {
    position: "absolute",
    bottom: 30,
    left: 30,
  },
  farmhouseEmoji: {
    fontSize: 28,
  },
  tractor: {
    position: "absolute",
    bottom: 30,
    right: 40,
  },
  tractorEmoji: {
    fontSize: 24,
  },
  farmOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
  },
  farmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B5E20",
    textShadowColor: "rgba(255,255,255,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  farmSubtitle: {
    fontSize: 14,
    color: "#2E7D32",
    marginTop: 4,
    fontWeight: "500",
    textShadowColor: "rgba(255,255,255,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Professional Card Styles
  actionsCard: {
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 20,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  actionItem: {
    width: "47%",
  },

  // Insights Card
  insightsCard: {
    marginBottom: 20,
    padding: 20,
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  insightDate: {
    fontSize: 13,
    color: "#9E9E9E",
    marginTop: 2,
    fontWeight: "500",
  },
  insightIcon: {
    fontSize: 24,
    backgroundColor: "#FFF3E0",
    padding: 8,
    borderRadius: 20,
  },
  insightContent: {
    gap: 16,
  },
  insightItem: {
    gap: 6,
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#424242",
    fontWeight: "400",
  },
  insightDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 4,
  },

  // Statistics Card
  statsCard: {
    padding: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2E7D32",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    fontWeight: "600",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
  },
});