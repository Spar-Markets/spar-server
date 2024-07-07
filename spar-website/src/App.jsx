import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";

const App = () => {
  return (
    <>
      <Navbar />
      <div className="lg:mx-40 mx-10">
        <HeroSection />
      </div>
    </>
  );
};

export default App;
