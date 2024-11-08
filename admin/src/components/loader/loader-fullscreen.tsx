import { Spinner } from '@sk-web-gui/react';

export default function LoaderFullScreen() {
  return (
    <main>
      <div className="w-screen h-screen flex place-items-center place-content-center">
        <Spinner aria-label="Laddar information" />
      </div>
    </main>
  );
}
