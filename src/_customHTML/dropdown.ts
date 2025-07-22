(
  document.querySelectorAll(".customDropdown") as NodeListOf<HTMLElement>
).forEach((select) => {
  const selectedOpt = select.querySelector(".propLabel")! as HTMLElement;
  const options = select.querySelector(".propDrop")! as HTMLElement;

  selectedOpt.addEventListener("click", (e) => {
    e.stopPropagation();

    document.querySelectorAll(".propDrop").forEach((dropdown) => {
      if (dropdown !== options) {
        (dropdown as HTMLElement).style.display = "none";
      }
    });

    options.style.display =
      options.style.display === "block" ? "none" : "block";
  });

  (options.querySelectorAll(".propOpt") as NodeListOf<HTMLElement>).forEach(
    (option) => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        selectedOpt.textContent = option.textContent;
        options.style.display = "none";
        select.dataset.selected = option.textContent!;

        // use or replace
        select.dispatchEvent(
          new CustomEvent("selectionChanged", {
            detail: { value: option.textContent },
          })
        );
      });
    }
  );

  document.addEventListener("click", (e) => {
    if (!select.contains(e.target as Node)) {
      options.style.display = "none";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      options.style.display = "none";
    }
  });
});
