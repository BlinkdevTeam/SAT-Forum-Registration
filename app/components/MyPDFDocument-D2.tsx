import {
  Document,
  Page,
  Text,
  Image,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const backgroundImage =
  "https://shvutlcgljqiidqxqrru.supabase.co/storage/v1/object/public/satf//satf_2025_24.jpg";

const styles = StyleSheet.create({
  page: { position: "relative" },
  container: { position: "relative", width: "100%", height: "100%" },
  backgroundImage: { position: "absolute", width: "100%", height: "100%" },
  overlayText: {
    position: "absolute",
    top: 280,
    left: 0,
    width: "100%",
    textAlign: "center",
    // fontSize: 36,
    color: "#000000",
    fontWeight: "bold",
  },
});
// Dynamic font size function
const getFontSize = (name: string) => {
  if (name.length <= 10) return 30;
  if (name.length <= 20) return 28;
  if (name.length <= 25) return 26;
  return 24;
};

export const MyPDFDocument = ({ name }: { name: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.container}>
        <Image src={backgroundImage} style={styles.backgroundImage} />
        <Text
          style={{
            ...styles.overlayText,
            fontSize: getFontSize(name),
          }}
        >
          {name.toUpperCase()}
        </Text>
      </View>
    </Page>
  </Document>
);
