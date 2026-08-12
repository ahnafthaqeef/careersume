// Placeholder shown while useRequireKey decides whether the user has a key.
// Keeps the page (and its data fetches) from flashing for someone who is about
// to be sent to the wizard.
export default function CheckingKey() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ground px-6">
      <p className="text-[14px] text-ink-3">Checking your key...</p>
    </div>
  );
}
