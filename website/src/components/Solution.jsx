import React, { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Helmet } from "react-helmet";

const Problem = ({ contestYear, problemCode }) => {
  const [solutions, setSolutions] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [actualProblemCode, setActualProblemCode] = useState(problemCode);
  const [testCaseData, setTestCaseData] = useState({ input: "", output: "" });

  useEffect(() => {
    const fetchSolutions = async () => {
      const alternativeCode = getAlternativeCode(problemCode, contestYear);
      let foundCode = problemCode;
      const solutionsArray = [];

      // First, try to fetch solutions for the original problem code
      const basePath = `/past_contests/${contestYear}/${problemCode}`;
      let solutionsFound = await fetchSolutionsForCode(basePath, problemCode);

      if (solutionsFound.length > 0) {
        solutionsArray.push(...solutionsFound);
        foundCode = problemCode;
      } else if (alternativeCode) {
        // If no solutions found for original code, try the alternative code
        const altBasePath = `/past_contests/${contestYear}/${alternativeCode}`;
        solutionsFound = await fetchSolutionsForCode(altBasePath, alternativeCode);
        if (solutionsFound.length > 0) {
          solutionsArray.push(...solutionsFound);
          foundCode = alternativeCode;
        }
      }

      if (solutionsArray.length > 0) {
        setSolutions(solutionsArray);
        setActualProblemCode(foundCode);
      } else {
        setSolutions([
          "Solution does not currently exist. If you have a solution, please upload your solution along with commented explanation on our forum. Thank you!",
        ]);
      }
    };

    fetchSolutions();
  }, [contestYear, problemCode]);

  const fetchSolutionsForCode = async (basePath, code) => {
    const solutionsArray = [];
    for (let i = 1; i <= 5; i++) {
      try {
        const response = await fetch(`${basePath}/solution${i === 1 ? "" : i}.txt`);
        if (response.ok) {
          const text = await response.text();
          if (!text.toLowerCase().includes("<!doctype html>")) {
            // Check if the solution matches the problem name
            if (solutionMatchesProblem(text, code)) {
              solutionsArray.push(text);
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching solution${i}:`, error);
      }
    }
    return solutionsArray;
  };

  const solutionMatchesProblem = (solutionText, code) => {
    const expectedProblemName = `${contestYear} ${code.toUpperCase()}`;
    return solutionText.includes(expectedProblemName);
  };

  useEffect(() => {
    document.title = `Solution: CCC ${contestYear} ${actualProblemCode.toUpperCase()}`;
    return () => {
      document.title = "CCCSolutions";
    };
  }, [contestYear, actualProblemCode]);

  const fetchTestCase = async (idx) => {
    const basePath = `/past_contests/${contestYear}/${problemCode}/test_data`;

    try {
      const inputResponse = await fetch(`${basePath}/${problemCode}.${idx + 1}.in`);
      const outputResponse = await fetch(`${basePath}/${problemCode}.${idx + 1}.out`);

      const inputText = inputResponse.ok ? await inputResponse.text() : "No input found";
      const outputText = outputResponse.ok ? await outputResponse.text() : "No output found";

      setTestCaseData({ input: inputText, output: outputText });
    } catch (error) {
      console.error(`Error fetching test case ${idx + 1}:`, error);
    }
  };

  const getAlternativeCode = (code, year) => {
    const yearNum = parseInt(year);
    const mapping = {
      j5: yearNum >= 2016 ? "s2" : "s3",
      j4: yearNum >= 2016 ? "s1" : "s2",
      j3: yearNum >= 2016 ? "" : "s1",
    };
    return mapping[code.toLowerCase()];
  };

  const handleTabClick = (idx) => {
    setActiveTab(idx);
    fetchTestCase(idx);
  };

  const isValidTestCase = (testCase) =>
    !testCase.toLowerCase().startsWith("<!doctype html>");

  const keywords = `CCC ${actualProblemCode} Solution, CCC ${problemCode},CCC ${actualProblemCode} Solutions, Solution ${actualProblemCode}, Solution ${actualProblemCode} CCC, Solutions ${actualProblemCode}, Solutions ${actualProblemCode} CCC`;

  return (
    <div className="bg-gray-200 min-h-screen p-8">
      <Helmet>
        <title>Solution: CCC {contestYear} {actualProblemCode.toUpperCase()}</title>
        <meta name="keywords" content={keywords}/>
        <meta property="og:title" content={`Solution: CCC ${contestYear} ${actualProblemCode.toUpperCase()}`}/>
        <meta property="og:description"
              content="The most comprehensive solution repository for the Canadian Computing Competition, with solutions to the CCC from 1996 to present."/>
        <meta property="og:url" content={window.location.href}/>
        <meta name="theme-color" content="#1e3a8a"/>
      </Helmet>
      <div className="w-full p-8 rounded-lg bg-white shadow-md">
        <h2 className="text-2xl font-semibold text-black mb-4">
          {`CCC ${contestYear} ${problemCode.toUpperCase()}`}
        </h2>

        {actualProblemCode !== problemCode && (
          <p className="text-sm text-gray-600 mb-4">
            Note: Showing solution for {actualProblemCode.toUpperCase()} as it's
            equivalent to {problemCode.toUpperCase()}.
          </p>
        )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-black mb-4">Test Cases:</h3>
            <div className="bg-gray-100 p-4 rounded-lg w-1/2 mx-auto">
              <div className="flex space-x-2 mb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400">
                {Array.from({length: 30}, (_, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleTabClick(idx)}
                        className={`px-4 py-2 flex-shrink-0 ${
                            activeTab === idx ? "bg-blue-800 text-white" : "bg-gray-200 text-black"
                        } rounded-lg`}
                    >
                      Case {idx + 1}
                    </button>
                ))}
              </div>

              <div className="p-4 bg-white rounded-lg">
                {isValidTestCase(testCaseData.input) && isValidTestCase(testCaseData.output) ? (
                    <>
                      <p className="text-black mb-2">
                        <strong>Input:</strong>
                      </p>
                      <textarea
                          className="w-full h-20 p-2 mb-4 bg-gray-100 text-black border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                          value={testCaseData.input}
                      />
                      <p className="text-black mb-2">
                        <strong>Output:</strong>
                      </p>
                      <textarea
                          className="w-full h-20 p-2 bg-gray-100 text-black border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          readOnly
                          value={testCaseData.output}
                      />
                    </>
                ) : (
                    <p className="text-red-600 font-bold text-center">
                      Test case irretrievable or unavailable
                    </p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-black mb-2">Solutions:</h3>
            {solutions.map((solution, idx) => (
                <div key={idx} className="mb-4">
                  <h4 className="text-md font-medium text-black mb-1">
                    Solution {idx + 1}:
                  </h4>
                  <SyntaxHighlighter language="cpp" style={solarizedlight} showLineNumbers>
                    {solution}
                  </SyntaxHighlighter>
                </div>
            ))}
          </div>
        </div>
      </div>
  );
};

export default Problem;
