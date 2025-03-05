class Boop < Formula
  desc "A Todoist CLI with purpose"
  homepage "https://github.com/kshehadeh/boop"
  version "${{ env.VERSION }}"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/kshehadeh/boop/releases/download/v#{version}/boop-mac"
      sha256 "${{ env.MAC_SHA }}"
    end
  end

  def install
    bin.install "boop-mac" => "boop"
    chmod 0755, bin/"boop"
  end

  test do
    system "#{bin}/boop", "--version"
  end
end 