require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'SpeechExport'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = ''
  s.homepage       = 'https://github.com/sion-neko/word_book'
  s.platforms      = {
    :ios => '15.1'
  }
  s.swift_version  = '5.9'
  s.static_framework = true
  s.source         = { path: '.' }
  s.source_files   = '**/*.{h,m,swift}'

  s.dependency 'ExpoModulesCore'
end
