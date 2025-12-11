import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components";

// Dummy data for preview
const PREVIEW_DATA = {
  monthlyReport: {
    userName: "John Doe",
    type: "monthly-report",
    data: {
      month: "December",
      stats: {
        totalIncome: 5000,
        totalExpenses: 3500,
        byCategory: {
          housing: 1500,
          groceries: 600,
          transportation: 400,
          entertainment: 300,
          utilities: 700,
        },
      },
      insights: [
        "Your housing expenses are 43% of your total spending - consider reviewing your housing costs.",
        "Great job keeping entertainment expenses under control this month!",
        "Setting up automatic savings could help you save 20% more of your income.",
      ],
    },
  },
  budgetAlert: {
    userName: "John Doe",
    type: "budget-alert",
    data: {
      percentageUsed: 85,
      budgetAmount: 4000,
      totalExpenses: 3400,
    },
  },
};

function capitalizeWords(str) {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function EmailTemplate({
  userName = "",
  type = "monthly-report",
  data = {},
}) {
  const formattedUserName = capitalizeWords(userName);
  if (type === "monthly-report") {
    return (
      <Html>
        <Head />
        <Preview>Your Monthly Financial Report</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Monthly Financial Report</Heading>

            <Text style={styles.text}>Hello {formattedUserName},</Text>
            <Text style={styles.text}>
              Here&rsquo;s your financial summary for {data?.month}:
            </Text>

            {/* Main Stats */}
            <Section style={styles.statsContainer}>
              <Section style={styles.stat}>
                <Text style={styles.statLabel}>Total Income</Text>
                <Text style={styles.statValue}>
                  ₱{(data?.stats?.totalIncome).toFixed(2)}
                </Text>
              </Section>
              <Section style={styles.stat}>
                <Text style={styles.statLabel}>Total Expenses</Text>
                <Text style={styles.statValue}>
                  ₱{(data?.stats?.totalExpenses).toFixed(2)}
                </Text>
              </Section>
              <Section style={styles.stat}>
                <Text style={styles.statLabel}>Net</Text>
                <Text style={styles.statValue}>
                  ₱
                  {(data?.stats?.totalIncome || 0) -
                    (data?.stats?.totalExpenses || 0)}
                </Text>
              </Section>
            </Section>

            {/* Category Breakdown */}
            {data?.stats?.byCategory && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>Expenses by Category</Heading>
                {Object.entries(data.stats.byCategory).map(
                  ([category, amount]) => (
                    <Row key={category} style={styles.row}>
                      <Column>
                        <Text style={styles.categoryText}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                      </Column>
                      <Column align="right">
                        <Text style={styles.categoryAmount}>
                          ₱{amount.toFixed(2)}
                        </Text>
                      </Column>
                    </Row>
                  )
                )}
              </Section>
            )}

            {/* AI Insights */}
            {data?.insights && data.insights.length > 0 && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>Swipe Advisor</Heading>
                {data.insights.map((insight, index) => (
                  <Text key={index} style={styles.insightText}>
                    • {insight}
                  </Text>
                ))}
              </Section>
            )}

            <Text style={styles.footer}>
              Swipe Budget Tracker - Empowering your financial health!
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "budget-alert") {
    const alertData =
      type === "budget-alert" && !data?.budgetAmount
        ? PREVIEW_DATA.budgetAlert.data
        : data;

    return (
      <Html>
        <Head />
        <Preview>
          Budget Alert - {alertData?.percentageUsed?.toFixed(1)}% Used
        </Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>⚠️ Budget Alert</Heading>
            <Text style={styles.text}>Hello {formattedUserName},</Text>
            <Text style={styles.text}>
              You&rsquo;ve used {alertData?.percentageUsed?.toFixed(1)}% of your
              monthly budget.
            </Text>
            <Section style={styles.statsContainer}>
              <Section style={styles.stat}>
                <Text style={styles.statLabel}>Budget Amount</Text>
                <Text style={styles.statValue}>₱{alertData?.budgetAmount}</Text>
              </Section>
              <Section style={styles.stat}>
                <Text style={styles.statLabel}>Spent So Far</Text>
                <Text style={styles.statValue}>
                  ₱{alertData?.totalExpenses}
                </Text>
              </Section>
              <Section style={styles.stat}>
                <Text style={styles.statLabel}>Remaining</Text>
                <Text style={styles.statValue}>
                  ₱
                  {(alertData?.budgetAmount || 0) -
                    (alertData?.totalExpenses || 0)}
                </Text>
              </Section>
            </Section>
            <Text style={styles.footer}>
              Keep track of your spending to stay within budget!
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  // Fallback
  return (
    <Html>
      <Head />
      <Preview>Email Template</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.text}>Invalid email type</Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f6f9fc",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "20px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "40px 30px",
    borderRadius: "8px",
    maxWidth: "600px",
  },
  title: {
    color: "#1f2937",
    fontSize: "28px",
    fontWeight: "bold",
    textAlign: "center",
    margin: "0 0 30px",
    lineHeight: "1.3",
  },
  heading: {
    color: "#1f2937",
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 16px",
  },
  text: {
    color: "#4b5563",
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "0 0 16px",
  },
  section: {
    marginTop: "30px",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  statsContainer: {
    margin: "30px 0",
    padding: "0",
  },
  stat: {
    marginBottom: "16px",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  statLabel: {
    color: "#6b7280",
    fontSize: "14px",
    margin: "0 0 8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statValue: {
    color: "#1f2937",
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0",
  },
  row: {
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  categoryText: {
    color: "#4b5563",
    fontSize: "16px",
    margin: "0",
  },
  categoryAmount: {
    color: "#1f2937",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0",
  },
  insightText: {
    color: "#4b5563",
    fontSize: "15px",
    lineHeight: "1.7",
    margin: "0 0 12px",
    paddingLeft: "8px",
  },
  footer: {
    color: "#6b7280",
    fontSize: "14px",
    textAlign: "center",
    marginTop: "40px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
    lineHeight: "1.5",
  },
};
