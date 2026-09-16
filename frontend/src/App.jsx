import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");

  const [passage, setPassage] = useState("");
  const [typedText, setTypedText] = useState("");

  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [timeLeft, setTimeLeft] = useState(60);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  const [wpmHistory, setWpmHistory] = useState([]);
  const [attempts, setAttempts] = useState([]);

  // Login / Signup
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] =
    useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] =
    useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] =
    useState("");
  const [showSignupPassword, setShowSignupPassword] =
    useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Fetch previous attempts
  const getAttempts = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/attempts"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch attempts");
      }

      const data = await response.json();

      setAttempts(data);
    } catch (error) {
      console.error("Error fetching attempts:", error);
    }
  };

  // Fetch random typing passage
  const startTest = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        "https://dummyjson.com/quotes/random"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch passage");
      }

      const data = await response.json();

      setPassage(data.quote);
      setTypedText("");
      setTimeLeft(60);
      setWpm(0);
      setAccuracy(0);
      setWpmHistory([]);
      setFinished(false);
      setStarted(true);
      setPage("typing");
    } catch (error) {
      console.error("Error:", error);

      setPassage(
        "Unable to load a typing passage. Please try again."
      );
    }

    setLoading(false);
  };

  // Load attempts
  useEffect(() => {
    getAttempts();
  }, []);

  // Timer
  useEffect(() => {
    if (!started || finished) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime <= 1) {
          clearInterval(timer);
          setFinished(true);
          return 0;
        }

        return previousTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, finished]);

  // Calculate WPM and Accuracy
  useEffect(() => {
    if (!started || typedText.length === 0) {
      return;
    }

    let correctCharacters = 0;

    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === passage[i]) {
        correctCharacters++;
      }
    }

    const elapsedTime = 60 - timeLeft;

    if (elapsedTime > 0) {
      const words = correctCharacters / 5;
      const minutes = elapsedTime / 60;

      const calculatedWpm = Math.round(
        words / minutes
      );

      setWpm(calculatedWpm);

      if (elapsedTime % 5 === 0) {
        setWpmHistory((previousHistory) => {
          const alreadyExists =
            previousHistory.some(
              (item) => item.time === elapsedTime
            );

          if (alreadyExists) {
            return previousHistory;
          }

          return [
            ...previousHistory,
            {
              time: elapsedTime,
              wpm: calculatedWpm,
            },
          ];
        });
      }
    }

    const calculatedAccuracy = Math.round(
      (correctCharacters / typedText.length) * 100
    );

    setAccuracy(calculatedAccuracy);
  }, [typedText, passage, timeLeft, started]);

  // Save attempt
  const saveAttempt = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/attempts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wpm: wpm,
            accuracy: accuracy,
            duration: 60 - timeLeft,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save attempt");
      }

      const data = await response.json();

      console.log("Attempt saved:", data);

      getAttempts();
    } catch (error) {
      console.error("Error saving attempt:", error);
    }
  };

  // Save result when test finishes
  useEffect(() => {
    if (!finished) {
      return;
    }

    saveAttempt();
  }, [finished]);

  // Handle typing
  const handleTyping = (event) => {
    if (finished) {
      return;
    }

    const value = event.target.value;

    if (value.length <= passage.length) {
      setTypedText(value);
    }

    if (
      value.length === passage.length &&
      passage.length > 0
    ) {
      setFinished(true);
    }
  };

  // Exit test
  const exitTest = () => {
    setStarted(false);
    setFinished(false);
    setTypedText("");
    setPage("home");
  };

  // Login
  const handleLogin = (event) => {
    event.preventDefault();

    if (!loginEmail || !loginPassword) {
      alert("Please enter your email and password.");
      return;
    }

    setIsLoggedIn(true);
    setUserName(loginEmail.split("@")[0]);

    setLoginEmail("");
    setLoginPassword("");

    alert("Login successful!");

    setPage("dashboard");
  };

  // Signup
  const handleSignup = (event) => {
    event.preventDefault();

    if (
      !signupName ||
      !signupEmail ||
      !signupPassword ||
      !signupConfirmPassword
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (signupPassword.length < 8) {
      alert(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!acceptTerms) {
      alert(
        "Please accept the Terms and Privacy Policy."
      );
      return;
    }

    setIsLoggedIn(true);
    setUserName(signupName);

    setSignupName("");
    setSignupEmail("");
    setSignupPassword("");
    setSignupConfirmPassword("");
    setAcceptTerms(false);

    alert("Account created successfully!");

    setPage("dashboard");
  };

  // Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName("");
    setPage("home");
  };

  // Dashboard statistics
  const totalAttempts = attempts.length;

  const bestWpm =
    attempts.length > 0
      ? Math.max(
          ...attempts.map((attempt) =>
            Number(attempt.wpm)
          )
        )
      : 0;

  const averageWpm =
    attempts.length > 0
      ? Math.round(
          attempts.reduce(
            (total, attempt) =>
              total + Number(attempt.wpm),
            0
          ) / attempts.length
        )
      : 0;

  const bestAccuracy =
    attempts.length > 0
      ? Math.max(
          ...attempts.map((attempt) =>
            Number(attempt.accuracy)
          )
        )
      : 0;

  // Navbar
  const Navbar = () => {
    return (
      <header className="navbar">
        <div
          className="logo"
          onClick={() => {
            setStarted(false);
            setFinished(false);
            setPage("home");
          }}
          style={{ cursor: "pointer" }}
        >
          Type<span>Track</span>
        </div>

        <nav>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setStarted(false);
              setFinished(false);
              setPage("home");
            }}
          >
            Home
          </a>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();

              if (started) {
                setPage("typing");
              } else {
                startTest();
              }
            }}
          >
            Typing Test
          </a>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setStarted(false);
              setFinished(false);
              setPage("dashboard");
            }}
          >
            Dashboard
          </a>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setStarted(false);
              setFinished(false);
              setPage("leaderboard");
            }}
          >
            Leaderboard
          </a>
        </nav>

        {isLoggedIn ? (
          <button
            className="login-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        ) : (
          <button
            className="login-btn"
            onClick={() => setPage("login")}
          >
            Login
          </button>
        )}
      </header>
    );
  };

  // HOME
  if (page === "home" && !started) {
    return (
      <div className="app">
        <Navbar />

        <main>
          <section className="hero">
            <p className="small-heading">
              TYPING PERFORMANCE TRACKER
            </p>

            <h1>
              Test your speed.
              <br />
              <span>
                Improve your performance.
              </span>
            </h1>

            <p className="description">
              Measure your typing speed, accuracy and
              progress with every test.
            </p>

            <button
              className="start-btn"
              onClick={startTest}
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : "Start Typing Test"}
            </button>
          </section>

          <section className="history-section">
            <h2>Previous Attempts</h2>

            {attempts.length === 0 ? (
              <p className="no-attempts">
                No previous attempts yet.
              </p>
            ) : (
              <div className="attempts-list">
                {attempts
                  .slice()
                  .reverse()
                  .map((attempt) => (
                    <div
                      className="attempt-card"
                      key={attempt.id}
                    >
                      <div>
                        <p>WPM</p>
                        <strong>
                          {attempt.wpm}
                        </strong>
                      </div>

                      <div>
                        <p>Accuracy</p>
                        <strong>
                          {attempt.accuracy}%
                        </strong>
                      </div>

                      <div>
                        <p>Duration</p>
                        <strong>
                          {attempt.duration}s
                        </strong>
                      </div>

                      <div>
                        <p>Date</p>
                        <strong>
                          {new Date(
                            attempt.date
                          ).toLocaleDateString()}
                        </strong>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // LOGIN
  if (page === "login") {
    return (
      <div className="app">
        <Navbar />

        <main className="auth-page">
          <section className="auth-container">
            <div className="auth-box professional-auth">
              <div className="security-icon">
                🔐
              </div>

              <h1>Welcome Back</h1>

              <p className="auth-subtitle">
                Login to continue to your TypeTrack
                account.
              </p>

              <form onSubmit={handleLogin}>
                <label>Email Address</label>

                <input
                  type="email"
                  className="auth-input"
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChange={(e) =>
                    setLoginEmail(e.target.value)
                  }
                />

                <div className="password-label">
                  <label>Password</label>

                  <button
                    type="button"
                    className="forgot-btn"
                    onClick={() =>
                      alert(
                        "Password recovery will be available after backend authentication is added."
                      )
                    }
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="password-wrapper">
                  <input
                    type={
                      showLoginPassword
                        ? "text"
                        : "password"
                    }
                    className="auth-input"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) =>
                      setLoginPassword(
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="show-password-btn"
                    onClick={() =>
                      setShowLoginPassword(
                        !showLoginPassword
                      )
                    }
                  >
                    {showLoginPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>

                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>

                <button
                  type="submit"
                  className="auth-main-btn"
                >
                  Login to TypeTrack
                </button>
              </form>

              <div className="auth-divider">
                <span>OR</span>
              </div>

              <p className="account-question">
                Don't have an account?
              </p>

              <button
                className="secondary-auth-btn"
                onClick={() => setPage("signup")}
              >
                Create New Account
              </button>

              <div className="security-message">
                <span>🔒</span>

                <div>
                  <strong>Your security matters</strong>
                  <p>
                    Your account information is
                    protected and handled securely.
                  </p>
                </div>
              </div>

              <button
                className="back-btn"
                onClick={() => setPage("home")}
              >
                Back to Home
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // SIGNUP
  if (page === "signup") {
    return (
      <div className="app">
        <Navbar />

        <main className="auth-page">
          <section className="auth-container">
            <div className="auth-box professional-auth">
              <div className="security-icon">
                🛡️
              </div>

              <h1>Create Your Account</h1>

              <p className="auth-subtitle">
                Join TypeTrack and start tracking your
                typing performance.
              </p>

              <form onSubmit={handleSignup}>
                <label>Full Name</label>

                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter your full name"
                  value={signupName}
                  onChange={(e) =>
                    setSignupName(e.target.value)
                  }
                />

                <label>Email Address</label>

                <input
                  type="email"
                  className="auth-input"
                  placeholder="Enter your email"
                  value={signupEmail}
                  onChange={(e) =>
                    setSignupEmail(e.target.value)
                  }
                />

                <label>Password</label>

                <div className="password-wrapper">
                  <input
                    type={
                      showSignupPassword
                        ? "text"
                        : "password"
                    }
                    className="auth-input"
                    placeholder="Create a password"
                    value={signupPassword}
                    onChange={(e) =>
                      setSignupPassword(
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="show-password-btn"
                    onClick={() =>
                      setShowSignupPassword(
                        !showSignupPassword
                      )
                    }
                  >
                    {showSignupPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>

                <div className="password-requirements">
                  <p>Password must contain:</p>

                  <span
                    className={
                      signupPassword.length >= 8
                        ? "requirement valid"
                        : "requirement"
                    }
                  >
                    ✓ At least 8 characters
                  </span>

                  <span
                    className={
                      /[A-Z]/.test(signupPassword)
                        ? "requirement valid"
                        : "requirement"
                    }
                  >
                    ✓ One uppercase letter
                  </span>

                  <span
                    className={
                      /[0-9]/.test(signupPassword)
                        ? "requirement valid"
                        : "requirement"
                    }
                  >
                    ✓ One number
                  </span>
                </div>

                <label>Confirm Password</label>

                <input
                  type="password"
                  className="auth-input"
                  placeholder="Confirm your password"
                  value={signupConfirmPassword}
                  onChange={(e) =>
                    setSignupConfirmPassword(
                      e.target.value
                    )
                  }
                />

                <label className="terms-check">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) =>
                      setAcceptTerms(
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    I agree to the Terms of Service and
                    Privacy Policy.
                  </span>
                </label>

                <button
                  type="submit"
                  className="auth-main-btn"
                >
                  Create Account
                </button>
              </form>

              <div className="auth-divider">
                <span>OR</span>
              </div>

              <p className="account-question">
                Already have an account?
              </p>

              <button
                className="secondary-auth-btn"
                onClick={() => setPage("login")}
              >
                Login to Existing Account
              </button>

              <div className="security-message">
                <span>🔒</span>

                <div>
                  <strong>Secure Account</strong>
                  <p>
                    We use secure authentication practices
                    to protect your account information.
                  </p>
                </div>
              </div>

              <button
                className="back-btn"
                onClick={() => setPage("home")}
              >
                Back to Home
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // DASHBOARD
  if (page === "dashboard") {
    return (
      <div className="app">
        <Navbar />

        <main>
          <section className="dashboard-section">
            <p className="small-heading">
              PERSONAL DASHBOARD
            </p>

            <h1 className="dashboard-title">
              {isLoggedIn
                ? `Welcome, ${userName}`
                : "Your Dashboard"}
            </h1>

            <p className="description">
              Track your typing performance and
              improvement.
            </p>

            <div className="dashboard-stats">
              <div className="dashboard-card">
                <p>BEST WPM</p>
                <strong>{bestWpm}</strong>
              </div>

              <div className="dashboard-card">
                <p>AVERAGE WPM</p>
                <strong>{averageWpm}</strong>
              </div>

              <div className="dashboard-card">
                <p>BEST ACCURACY</p>
                <strong>{bestAccuracy}%</strong>
              </div>

              <div className="dashboard-card">
                <p>TOTAL TESTS</p>
                <strong>{totalAttempts}</strong>
              </div>
            </div>

            <section className="history-section dashboard-history">
              <h2>Recent Attempts</h2>

              {attempts.length === 0 ? (
                <p className="no-attempts">
                  No attempts available.
                </p>
              ) : (
                <div className="attempts-list">
                  {attempts
                    .slice()
                    .reverse()
                    .slice(0, 5)
                    .map((attempt) => (
                      <div
                        className="attempt-card"
                        key={attempt.id}
                      >
                        <div>
                          <p>WPM</p>
                          <strong>
                            {attempt.wpm}
                          </strong>
                        </div>

                        <div>
                          <p>Accuracy</p>
                          <strong>
                            {attempt.accuracy}%
                          </strong>
                        </div>

                        <div>
                          <p>Duration</p>
                          <strong>
                            {attempt.duration}s
                          </strong>
                        </div>

                        <div>
                          <p>Date</p>
                          <strong>
                            {new Date(
                              attempt.date
                            ).toLocaleDateString()}
                          </strong>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </section>
        </main>
      </div>
    );
  }

  // LEADERBOARD
  if (page === "leaderboard") {
    const leaderboard = attempts
      .slice()
      .sort(
        (a, b) =>
          Number(b.wpm) - Number(a.wpm)
      );

    return (
      <div className="app">
        <Navbar />

        <main>
          <section className="leaderboard-section">
            <p className="small-heading">
              TYPETRACK COMPETITION
            </p>

            <h1>Leaderboard</h1>

            <p className="description">
              Compare typing performance and track the
              highest recorded speeds.
            </p>

            {leaderboard.length === 0 ? (
              <div className="leaderboard-empty">
                <h2>No scores yet</h2>

                <p>
                  Complete a typing test to appear on
                  the leaderboard.
                </p>

                <button
                  className="start-btn"
                  onClick={startTest}
                >
                  Start Typing Test
                </button>
              </div>
            ) : (
              <div className="leaderboard-table">
                <div className="leaderboard-row leaderboard-heading">
                  <div>Rank</div>
                  <div>WPM</div>
                  <div>Accuracy</div>
                  <div>Duration</div>
                  <div>Date</div>
                </div>

                {leaderboard.map(
                  (attempt, index) => (
                    <div
                      className="leaderboard-row"
                      key={attempt.id}
                    >
                      <div>
                        #{index + 1}
                      </div>

                      <div>
                        <strong>
                          {attempt.wpm}
                        </strong>
                      </div>

                      <div>
                        {attempt.accuracy}%
                      </div>

                      <div>
                        {attempt.duration}s
                      </div>

                      <div>
                        {new Date(
                          attempt.date
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // TYPING TEST
  return (
    <div className="app">
      <header className="navbar">
        <div
          className="logo"
          onClick={exitTest}
          style={{ cursor: "pointer" }}
        >
          Type<span>Track</span>
        </div>

        <nav>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              exitTest();
            }}
          >
            Home
          </a>

          <a href="#">Typing Test</a>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              exitTest();
              setPage("dashboard");
            }}
          >
            Dashboard
          </a>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              exitTest();
              setPage("leaderboard");
            }}
          >
            Leaderboard
          </a>
        </nav>

        <button
          className="login-btn"
          onClick={exitTest}
        >
          Exit
        </button>
      </header>

      <main>
        <section className="typing-section">
          <div className="test-header">
            <div>
              <p>TIME</p>
              <h2>{timeLeft}</h2>
            </div>

            <div>
              <p>WPM</p>
              <h2>{wpm}</h2>
            </div>

            <div>
              <p>ACCURACY</p>
              <h2>{accuracy}%</h2>
            </div>
          </div>

          <div className="passage">
            {passage.split("").map(
              (character, index) => {
                let className = "";

                if (index < typedText.length) {
                  className =
                    typedText[index] === character
                      ? "correct"
                      : "incorrect";
                }

                return (
                  <span
                    key={index}
                    className={className}
                  >
                    {character}
                  </span>
                );
              }
            )}
          </div>

          <textarea
            className="typing-input"
            placeholder={
              finished
                ? "Test completed!"
                : "Start typing here..."
            }
            value={typedText}
            onChange={handleTyping}
            disabled={finished}
            autoFocus
          />

          {wpmHistory.length > 0 && (
            <div className="graph-box">
              <h2>WPM Performance</h2>

              <div className="graph">
                {wpmHistory.map(
                  (point, index) => {
                    const maxWpm = Math.max(
                      ...wpmHistory.map(
                        (item) => item.wpm
                      ),
                      50
                    );

                    const left =
                      wpmHistory.length === 1
                        ? 50
                        : (index /
                            (wpmHistory.length - 1)) *
                          100;

                    const bottom =
                      (point.wpm / maxWpm) * 85;

                    return (
                      <div
                        key={point.time}
                        className="graph-point"
                        style={{
                          left: `${left}%`,
                          bottom: `${bottom}%`,
                        }}
                      >
                        <span className="point-value">
                          {point.wpm}
                        </span>

                        <span className="point-dot"></span>

                        <span className="point-time">
                          {point.time}s
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {finished && (
            <div className="result-box">
              <h2>Test Completed!</h2>

              <div className="final-stats">
                <div>
                  <p>WPM</p>
                  <strong>{wpm}</strong>
                </div>

                <div>
                  <p>Accuracy</p>
                  <strong>
                    {accuracy}%
                  </strong>
                </div>
              </div>

              <button
                className="start-btn"
                onClick={startTest}
              >
                Try Again
              </button>

              <button
                className="back-btn"
                onClick={exitTest}
              >
                Back to Home
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;