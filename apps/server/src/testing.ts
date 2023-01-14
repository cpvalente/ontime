type testingString = string;

export default function logThis(text: testingString): testingString {
  console.log(text);
  return text;
}
