{
  description = "Ontime is a browser-based application that manages event rundowns, scheduling, and cueing.";

  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];
      perSystem =
        {
          config,
          self',
          inputs',
          pkgs,
          system,
          ...
        }:
        {
          formatter = pkgs.nixfmt-tree;
          packages.default = pkgs.callPackage (
            {
              stdenv,
              nodejs,
              pnpm,
            }:

            stdenv.mkDerivation (finalAttrs: {
              pname = "ontime";
              version = "1.0.0";

              src = ./.;

              nativeBuildInputs = [
                nodejs
                pnpm.configHook
              ];

              pnpmDeps = pnpm.fetchDeps {
                inherit (finalAttrs) pname version src;
                fetcherVersion = 2;
                hash = "sha256-V8gevVuEA5J2g/wj6KGOxpaTNj7SXmE1hVxtSb0uMBo=";
              };
            })
          ) { };
          devShells.default =
            with pkgs;
            mkShellNoCC {
              packages = [
                pnpm
                nodejs
              ];
              # npmDeps = importNpmLock.buildNodeModules {
              #   npmRoot = ./.;
              #   inherit nodejs;
              # };
            };
        };
    };
}
