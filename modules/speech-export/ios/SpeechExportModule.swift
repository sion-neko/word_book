import ExpoModulesCore
import AVFoundation

struct SpeechExportSegment: Record {
  @Field
  var text: String = ""
  @Field
  var language: String = "en-US"
  @Field
  var voiceIdentifier: String? = nil
  @Field
  var rate: Double = 1.0
  @Field
  var pauseAfterMs: Double = 0
}

internal final class SpeechExportException: GenericException<String> {
  override var reason: String {
    "Failed to export speech: \(param)"
  }
}

internal final class NoAudioProducedException: Exception {
  override var reason: String {
    "No audio was produced for the given segments"
  }
}

public final class SpeechExportModule: Module {
  // AVSpeechSynthesizer stops delivering buffers if it is deallocated before
  // the write callback finishes, so we keep strong references for the
  // duration of a single export call.
  private var activeSynthesizers: [AVSpeechSynthesizer] = []

  public func definition() -> ModuleDefinition {
    Name("SpeechExport")

    AsyncFunction("exportToFile") { (segments: [SpeechExportSegment], fileName: String) -> String in
      try await self.exportSegments(segments, fileName: fileName)
    }
  }

  private func exportSegments(_ segments: [SpeechExportSegment], fileName: String) async throws -> String {
    activeSynthesizers.removeAll()
    defer { activeSynthesizers.removeAll() }

    var format: AVAudioFormat?
    var chunks: [(buffer: AVAudioPCMBuffer, silenceFrames: AVAudioFrameCount)] = []

    for segment in segments {
      let utterance = AVSpeechUtterance(string: segment.text)
      if let voiceIdentifier = segment.voiceIdentifier,
         let voice = AVSpeechSynthesisVoice(identifier: voiceIdentifier) {
        utterance.voice = voice
      } else {
        utterance.voice = AVSpeechSynthesisVoice(language: segment.language)
      }
      utterance.rate = Float(segment.rate) * AVSpeechUtteranceDefaultSpeechRate

      let rawBuffers = await synthesize(utterance)
      guard !rawBuffers.isEmpty else { continue }

      if format == nil {
        format = rawBuffers[0].format
      }
      guard let audioFormat = format else { continue }

      // 言語/ボイスが変わるとネイティブのサンプルレートが変わることがあるため、
      // 最初のセグメントで決めたフォーマットに揃えないとAVAudioFile.write時にクラッシュする
      let buffers = rawBuffers.compactMap { convert($0, to: audioFormat) }
      guard !buffers.isEmpty else { continue }

      // NaNや負数をAVAudioFrameCount(UInt32)に変換すると実行時トラップになるためクランプする
      let pauseMs = segment.pauseAfterMs.isFinite ? max(0, segment.pauseAfterMs) : 0
      for (index, buffer) in buffers.enumerated() {
        let isLast = index == buffers.count - 1
        let silenceFrames: AVAudioFrameCount = isLast
          ? AVAudioFrameCount((pauseMs / 1000.0) * audioFormat.sampleRate)
          : 0
        chunks.append((buffer, silenceFrames))
      }
    }

    guard let audioFormat = format else {
      throw NoAudioProducedException()
    }

    let tempDir = FileManager.default.temporaryDirectory
    let rawURL = tempDir.appendingPathComponent(UUID().uuidString).appendingPathExtension("caf")
    let outputURL = tempDir.appendingPathComponent(fileName).appendingPathExtension("m4a")

    if FileManager.default.fileExists(atPath: outputURL.path) {
      try? FileManager.default.removeItem(at: outputURL)
    }

    // forWriting:settings: だけだと処理フォーマットがFloat32固定になり、
    // シンセサイザーがInt16バッファを返す環境ではwrite時にクラッシュするため、
    // バッファと同じcommonFormat/interleavedを明示する
    let audioFile = try AVAudioFile(
      forWriting: rawURL,
      settings: audioFormat.settings,
      commonFormat: audioFormat.commonFormat,
      interleaved: audioFormat.isInterleaved
    )
    for chunk in chunks {
      try audioFile.write(from: chunk.buffer)
      if chunk.silenceFrames > 0, let silence = makeSilence(format: audioFormat, frameCount: chunk.silenceFrames) {
        try audioFile.write(from: silence)
      }
    }

    try await convertToM4A(from: rawURL, to: outputURL)
    try? FileManager.default.removeItem(at: rawURL)

    return outputURL.absoluteString
  }

  private func synthesize(_ utterance: AVSpeechUtterance) async -> [AVAudioPCMBuffer] {
    await withCheckedContinuation { continuation in
      var buffers: [AVAudioPCMBuffer] = []
      let synthesizer = AVSpeechSynthesizer()
      activeSynthesizers.append(synthesizer)
      synthesizer.write(utterance) { audioBuffer in
        guard let pcmBuffer = audioBuffer as? AVAudioPCMBuffer, pcmBuffer.frameLength > 0 else {
          continuation.resume(returning: buffers)
          return
        }
        buffers.append(pcmBuffer)
      }
    }
  }

  private func convert(_ buffer: AVAudioPCMBuffer, to format: AVAudioFormat) -> AVAudioPCMBuffer? {
    if buffer.format.isEqual(format) {
      return buffer
    }
    guard let converter = AVAudioConverter(from: buffer.format, to: format) else {
      return nil
    }
    let ratio = format.sampleRate / buffer.format.sampleRate
    let capacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 1024
    guard let converted = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: capacity) else {
      return nil
    }

    var consumed = false
    var conversionError: NSError?
    converter.convert(to: converted, error: &conversionError) { _, outStatus in
      if consumed {
        outStatus.pointee = .endOfStream
        return nil
      }
      consumed = true
      outStatus.pointee = .haveData
      return buffer
    }

    return conversionError == nil ? converted : nil
  }

  private func makeSilence(format: AVAudioFormat, frameCount: AVAudioFrameCount) -> AVAudioPCMBuffer? {
    guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
      return nil
    }
    buffer.frameLength = frameCount

    // Freshly allocated buffers are not guaranteed to be zeroed.
    if let floatData = buffer.floatChannelData {
      for channel in 0..<Int(format.channelCount) {
        memset(floatData[channel], 0, Int(frameCount) * MemoryLayout<Float>.size)
      }
    } else if let int16Data = buffer.int16ChannelData {
      for channel in 0..<Int(format.channelCount) {
        memset(int16Data[channel], 0, Int(frameCount) * MemoryLayout<Int16>.size)
      }
    }
    return buffer
  }

  private func convertToM4A(from inputURL: URL, to outputURL: URL) async throws {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      let asset = AVURLAsset(url: inputURL)
      guard let exportSession = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetAppleM4A) else {
        continuation.resume(throwing: SpeechExportException("could not create export session"))
        return
      }
      exportSession.outputURL = outputURL
      exportSession.outputFileType = .m4a
      exportSession.exportAsynchronously {
        switch exportSession.status {
        case .completed:
          continuation.resume(returning: ())
        case .failed, .cancelled:
          continuation.resume(throwing: exportSession.error ?? SpeechExportException("export failed"))
        default:
          continuation.resume(throwing: SpeechExportException("unexpected export status"))
        }
      }
    }
  }
}
