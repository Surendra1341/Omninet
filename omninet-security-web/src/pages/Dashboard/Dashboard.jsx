function Dashboard() {
  const loremText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
  const repeatedLorem = Array(30).fill(loremText).join(" ");
  return (
    <div>
      <h1 className="text-3xl font-bold underline">Dashboard</h1>
      <p>{repeatedLorem}</p>
      <p>{repeatedLorem}</p>
      <p>{repeatedLorem}</p>
    </div>
  );
}

export default Dashboard;