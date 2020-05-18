const strongRegex = /([\W_]|^)(\*\*|__)(?=\S)([^\r]*?\S[\*_]*)\2([\W_]|$)/g;
const italicRegex = /([\W_]|^)(\*|_)(?=\S)([^\r\*_]*?\S)\2([\W_]|$)/g;

const parser = (markdownOrEntry) => {
  // console.log(markdownOrEntry);
  let returns = markdownOrEntry;
  if (!returns.hasOwnProperty("entries") && returns.indexOf("**") === 0) {
    const [__, title, ...rest] = returns.split("**");
    const recompiledRest = rest.join("**");
    returns = {
      type: "entries",
      name: title,
      entries: [recompiledRest],
    };
  }
  // recursively handle already formatted entries
  if (returns.hasOwnProperty("entries")) {
    return {
      ...returns,
      entries: returns.entries.map(parser),
    };
  }

  // convert **strong**

  if (strongRegex.test(returns)) {
    returns = returns.replace(strongRegex, "$1{@b $3}$4");
    console.log(returns);
  }
  // convert *italic*
  if (italicRegex.test(returns)) {
    // check if is spell

    // if not spell
    returns = returns.replace(italicRegex, "$1{@i $3}$4");
    console.log(returns);
  }

  return returns;
};

module.exports = parser;
