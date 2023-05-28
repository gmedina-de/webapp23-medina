/**
 *  Undisplay all form fields classified with a Movie segment name
 *  from MovieCategoryEL.labels
 */
function undisplayAllSegmentFields(domNode, segmentNames) {
  if (!domNode) domNode = document;  // normally invoked for a form element
  for (const segmentName of segmentNames) {
    const fields = domNode.getElementsByClassName(segmentName);
    for (const el of fields) {
      el.style.display = "none";
    }
  }
}
/**
 *  Display the form fields classified with a Movie segment name
 *  from MovieCategoryEL.labels
 */
function displaySegmentFields(domNode, segmentNames, segmentIndex) {
  if (!domNode) domNode = document;  // normally invoked for a form element
  for (let i = 0; i < segmentNames.length; i++) {
    const fields = domNode.getElementsByClassName(segmentNames[i]);
    for (const el of fields) {
      el.style.display = (i === segmentIndex - 1) ? "block" : "none";
    }
  }
}

export { undisplayAllSegmentFields, displaySegmentFields };
